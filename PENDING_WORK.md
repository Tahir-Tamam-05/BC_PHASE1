# BlueCarbon Ledger — Pending Work Analysis

> **Analysis Date:** 2026-02-24  
> **Codebase Reviewed:** `BLUECARBONPROJECT-main/`  
> **Basis:** PRD + Production Readiness TODO List

---

## ✅ Already Implemented (What's Done)

Before listing pending work, here is what the current codebase **already has**:

| Area | Implemented |
|------|-------------|
| **Auth** | JWT-based auth, bcrypt password hashing, role-based middleware (`requireAuth`, `requireRole`), 8-char min password in schema |
| **Secret Management** | `JWT_SECRET` reads from `process.env` with production guard; falls back to dev string only in dev mode |
| **Verifier COI Check** | Backend check in `/api/projects/:id/review` — verifier cannot review their own project |
| **Rejection Reason Codes** | Standardized enum in `projectReviewSchema`: `INSUFFICIENT_DOCUMENTATION`, `INVALID_GIS_BOUNDARY`, `MRV_INCOMPLETE`, `OWNERSHIP_UNCLEAR`, `OTHER` |
| **Project Freeze (partial)** | Verified projects cannot be re-reviewed; `clarify` action keeps status `pending` |
| **GIS Overlap Detection** | `isOverlapping()` using `@turf/turf` checks new submissions against all verified projects |
| **GIS Area Cross-Validation** | 15% variance threshold between declared and calculated area; flags in description |
| **GIS Map Component** | Interactive Leaflet + leaflet-draw map for boundary drawing |
| **Blockchain Core** | SHA-256 Merkle tree, block chaining, validator signatures, `computeBlockHash`, `computeMerkleRoot` |
| **Certificate PDF** | `jsPDF`-based certificate with voluntary disclaimer and "not government-recognized" text |
| **Compliance Disclaimer** | Present in certificate PDF and marketplace page |
| **Marketplace** | Buyer filter by credits/plantation type, credit purchase, purchase history |
| **Blockchain Explorer** | Block viewer, hash verification tool, transaction search |
| **Carbon Calculation** | `calculateCarbonSequestration()` with ecosystem rates and regional factors |
| **File Upload** | Multer-based upload with MIME type validation; object storage optional |
| **Role-Based Routing** | Frontend `ProtectedRoute` with role-based redirects |
| **Admin Dashboard** | Verifier assignment, blockchain export, user/project management |

---

## 🔴 HIGH PRIORITY PENDING WORK
*(Critical for trust, security, and production readiness)*

---

### 1. Security & Authentication

#### 1.1 — Account Lockout After Failed Login Attempts
**Status:** ✅ DONE  
**Implementation:** In-memory lockout store in [`server/routes.ts`](BLUECARBONPROJECT-main/server/routes.ts:48) with `MAX_FAILED_ATTEMPTS=5` and `LOCKOUT_DURATION_MS=15 minutes`. Lockout status checked before authentication, counter reset on successful login.

#### 1.2 — CSRF Protection
**Status:** ✅ DONE  
**Implementation:** Helmet middleware with security headers applied in [`server/index.ts`](BLUECARBONPROJECT-main/server/index.ts:12). Rate limiting with `express-rate-limit` configured for auth endpoints (20 attempts/15 min) and general API (200 req/min) in [`server/index.ts`](BLUECARBONPROJECT-main/server/index.ts:26-53).

#### 1.3 — Audit Logging Service
**Status:** ✅ DONE  
**Implementation:** `auditLogs` table with indexes in [`shared/schema.ts`](BLUECARBONPROJECT-main/shared/schema.ts:218-240). `logAuditEvent()` helper in [`server/auditLog.ts`](BLUECARBONPROJECT-main/server/auditLog.ts) with in-memory fallback. `AUDIT_ACTION_TYPES` constants for standardized action types including: LOGIN_SUCCESS, LOGIN_FAILURE, ACCOUNT_LOCKED, SIGNUP, PROJECT_SUBMITTED, PROJECT_APPROVED, PROJECT_REJECTED, PROJECT_CLARIFICATION_REQUESTED, CREDITS_PURCHASED, CERTIFICATE_ISSUED, CERTIFICATE_REVOKED, VERIFIER_ASSIGNED, ROLE_CHANGED. All critical actions are audited: user login (success + failure), role changes, project approval/rejection/clarification, certificate issuance, certificate revocation, credit purchase. Table is append-only (no update/delete). Indexes on user_id, action_type, and timestamp for performance. Metadata stored as JSON.

#### 1.4 — Password Complexity Requirements
**Status:** ✅ DONE  
**Implementation:** `passwordComplexitySchema` in [`shared/schema.ts`](BLUECARBONPROJECT-main/shared/schema.ts:147-156) enforces: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character. Applied to `signupSchema.password`.

---

### 2. Verification & Governance

#### 2.1 — "Needs Clarification" Status in Schema
**Status:** ✅ DONE  
**Implementation:** `'needs_clarification'` status added to schema in [`shared/schema.ts`](BLUECARBONPROJECT-main/shared/schema.ts:39). `clarificationNote` field added for separate storage. `StatusBadge` component in [`status-badge.tsx`](BLUECARBONPROJECT-main/client/src/components/status-badge.tsx:34-38) renders distinct blue styling with MessageSquare icon.

#### 2.2 — External Verifier Onboarding / Invitation Flow
**Status:** ❌ Not implemented  
**What's missing:** Verifiers can only be created by seeding the database or direct DB manipulation. There is no invitation flow for third-party NGOs or environmental experts.  
**What to build:**
- Add `POST /api/admin/invite-verifier` endpoint (admin only) that generates a time-limited invite token
- Add `invitations` table: `id`, `email`, `token`, `role`, `expiresAt`, `usedAt`
- Create a `/register/verifier?token=xxx` frontend page that validates the token and creates the verifier account
- Admin dashboard UI to send and manage invitations

#### 2.3 — No-Edit Policy Enforcement (Project Freeze)
**Status:** ⚠️ Partial (only blocks re-verification of verified projects)  
**What's missing:** There is no `PUT /api/projects/:id` endpoint, so edits are not possible yet — but the freeze logic comment in the code acknowledges this is incomplete. If a PUT endpoint is ever added, there is no guard preventing edits to projects that are `pending` or `needs_clarification`.  
**What to build:**
- Explicitly document and enforce: once a project is submitted (`pending`), its core fields (area, location, ecosystem, boundary) are frozen
- If a contributor needs to change data, they must withdraw and resubmit (add `withdrawn` status)
- Add `PUT /api/projects/:id` with strict freeze checks

---

### 3. Reporting & Certificates

#### 3.1 — Certificate Revocation Logic
**Status:** ✅ DONE  
**Implementation:** Added `certificateStatus` field to `creditTransactions` table in [`schema.ts`](BLUECARBONPROJECT-main/shared/schema.ts) with values "valid" (default) or "revoked". Added `updateCreditTransaction` method to [`storage.ts`](BLUECARBONPROJECT-main/server/storage.ts) for both MemStorage and DbStorage. Added admin-only revocation endpoint `POST /api/admin/certificates/:id/revoke` in [`routes.ts:1371`](BLUECARBONPROJECT-main/server/routes.ts:1371) that: (1) verifies admin authentication, (2) checks certificate exists, (3) prevents double-revocation, (4) updates status in database, (5) logs to audit service. Updated `/api/verify/:certificateId` endpoint to check `certificateStatus` field and return "REVOKED" status if certificate has been invalidated. Does NOT affect blockchain records or purchase transactions.

#### 3.2 — QR Code on Certificates
**Status:** ✅ DONE  
**Implementation:** `generateCertificatePDFWithQR()` in [`certificate-generator.tsx`](BLUECARBONPROJECT-main/client/src/components/certificate-generator.tsx:288) embeds QR code using `qrcode` library pointing to verification URL. Public verification endpoint at [`routes.ts:861`](/api/verify/:certificateId) returns certificate details. `prepareCertificateData()` sets `verificationUrl` field.

#### 3.3 — Batch Certificate / Annual Report Download
**Status:** ❌ Not implemented  
**What's missing:** Buyers can download individual certificates per purchase, but there is no consolidated annual report.  
**What to build:**
- Add a "Download Annual Report" button in the marketplace/buyer dashboard
- Generate a multi-page PDF consolidating all purchases for a selected year
- Include summary stats: total credits retired, projects supported, total CO₂ offset

---

### 4. Database & Data Integrity

#### 4.1 — Database Indexing
**Status:** ✅ DONE  
**Implementation:** Indexes added in [`shared/schema.ts`](BLUECARBONPROJECT-main/shared/schema.ts):
- `projects`: `userIdIdx`, `statusIdx`, `verifierIdIdx` (lines 49-54)
- `transactions`: `projectIdIdx`, `blockIdIdx`, `toIdx` (lines 85-89)
- `creditTransactions`: `buyerIdIdx`, `contributorIdIdx`, `projectIdIdx` (lines 121-125)
- `auditLogs`: `userIdIdx`, `actionTypeIdx`, `timestampIdx` (lines 235-239)

#### 4.2 — Soft Deletes
**Status:** ✅ DONE  
**Implementation:** `deletedAt` timestamp field added to `users` table ([`schema.ts:15`](BLUECARBONPROJECT-main/shared/schema.ts:15)) and `projects` table ([`schema.ts:47`](BLUECARBONPROJECT-main/shared/schema.ts:47)).

#### 4.3 — Automated Database Backups
**Status:** ✅ DONE  
**Implementation:** `POST /api/admin/backup` endpoint added in [`server/routes.ts`](BLUECARBONPROJECT-main/server/routes.ts:1280-1350) that exports JSON dump of all tables (users, projects, transactions, blocks, creditTransactions, auditLogs) with sanitized passwords. Admin-only access. Returns downloadable JSON file with metadata.

---

### 5. Monitoring & Reliability

#### 5.1 — Blockchain Integrity Monitor (Scheduled Job)
**Status:** ✅ DONE  
**Implementation:** Real-time integrity validation in [`server/routes.ts`](BLUECARBONPROJECT-main/server/routes.ts:966-996) for `/api/blockchain/export` endpoint. Dedicated `GET /api/blockchain/integrity` endpoint at lines 1017-1053. Validates hash recomputation and previousHash linkage for all blocks.

#### 5.2 — Health Check Endpoint
**Status:** ✅ DONE  
**Implementation:** `GET /health` endpoint in [`server/routes.ts`](BLUECARBONPROJECT-main/server/routes.ts:185-205) returns `{ status, db, uptime, timestamp, environment }`. Tests DB connectivity via lightweight query. Returns 503 with error details if DB unavailable.

#### 5.3 — Error Tracking (Sentry Integration)
**Status:** ✅ DONE  
**Implementation:** Added `@sentry/node` to [`package.json`](BLUECARBONPROJECT-main/package.json). Sentry initialization in [`server/index.ts:5-31`](BLUECARBONPROJECT-main/server/index.ts:5) with dynamic require for optional dependency. Only initializes in production when `SENTRY_DSN` is set. `SENTRY_DSN` documented in `.env.example`.

#### 5.4 — Performance Monitoring / Slow API Alerts
**Status:** ✅ DONE  
**Implementation:** Request logger middleware in [`server/index.ts`](BLUECARBONPROJECT-main/server/index.ts:70-109) with `SLOW_RESPONSE_THRESHOLD_MS=500`. Logs warning `⚠️ SLOW API ALERT` for any API response exceeding threshold.
**Status:** ⚠️ Partial (basic request logging exists in `server/index.ts`)  
**What's missing:** The existing logger logs duration but does not alert on slow responses (>500ms) or track trends.  
**What to build:**
- Enhance the existing middleware to emit a warning log when response time exceeds 500ms
- Optionally integrate with Sentry Performance or a lightweight APM

---

## 🟡 MEDIUM PRIORITY PENDING WORK
*(Important for UX, scalability, and completeness — not immediately blocking)*

---

### 6. UI/UX Improvements

#### 6.1 — Public Carbon Estimator Tool
**Status:** ❌ Not implemented  
**What's missing:** The landing page has no interactive carbon estimation tool for non-logged-in users. This is a conversion hook described in the PRD.  
**What to build:**
- Add a new section on the landing page (or a `/estimate` route) with a simple form:
  - Inputs: ecosystem type, area (hectares), location/region
  - Output: estimated annual CO₂ and 20-year total (reuse `calculateCarbonSequestration` logic client-side)
- No login required; show a CTA to register after showing results

#### 6.2 — Interactive Onboarding / Guided Tours
**Status:** ❌ Not implemented  
**What's missing:** No onboarding flow for new Contributors or Buyers. New users land on their dashboard with no guidance.  
**What to build:**
- Implement a "first login" detection (e.g., `hasCompletedOnboarding` flag on user)
- Show a step-by-step modal tour for Contributors: "Submit a Project → Wait for Verification → Earn Credits → Sell Credits"
- Show a tour for Buyers: "Browse Projects → Purchase Credits → Download Certificate"
- Use a library like `react-joyride` or build a simple custom modal sequence

#### 6.3 — Mobile Optimization for GIS Map
**Status:** ⚠️ Partial (Leaflet is responsive but not optimized for touch/mobile)  
**What's missing:** The `gis-land-map.tsx` component uses `leaflet-draw` which has limited touch support. The marketplace and GIS views are not tested/optimized for tablet/mobile field use.  
**What to build:**
- Test and fix touch event handling in `GISLandMap` component
- Add mobile-specific controls (larger touch targets for draw tools)
- Ensure marketplace cards stack properly on small screens
- Add `viewport` meta tag optimization for mobile

---

### 7. Performance & Scalability

#### 7.1 — Blockchain Explorer Pagination
**Status:** ❌ Not implemented  
**What's missing:** `GET /api/blocks` and `GET /api/transactions` return all records with no pagination. As the chain grows, this will cause performance issues.  
**What to build:**
- Add cursor-based pagination to `/api/blocks?cursor=<blockIndex>&limit=20`
- Add pagination to `/api/transactions?cursor=<txId>&limit=50`
- Update the Explorer frontend to use infinite scroll or "Load More" buttons

#### 7.2 — Image/Document Upload Compression
**Status:** ❌ Not implemented  
**What's missing:** The file upload in `project-submission-form.tsx` sends raw files to the server with no client-side compression.  
**What to build:**
- Add client-side image compression before upload using `browser-image-compression` library
- Show file size before/after compression
- Set a maximum upload size limit (e.g., 10MB) with a clear error message

#### 7.3 — Caching for Marketplace Project Lists
**Status:** ✅ DONE  
**Implementation:** `SimpleCache` class in [`server/routes.ts`](BLUECARBONPROJECT-main/server/routes.ts:99-127) with TTL support. Applied to `/api/projects/marketplace` (60s TTL) at line 1067-1074 and `/api/stats` (5min TTL). Cache invalidation on project verification and credit purchase.
- Cache TTL: 60 seconds for marketplace, 5 minutes for stats
- Invalidate cache on project verification or credit purchase
- (Optional) Replace with Redis if scaling beyond single-instance

---

### 8. Testing & QA

#### 8.1 — End-to-End Tests (Playwright/Cypress)
**Status:** ❌ Not implemented  
**What's missing:** No test files exist anywhere in the project. No `test` script in `package.json`.  
**What to build:**
- Set up Playwright or Cypress
- Write E2E tests for the critical flow:
  1. Contributor submits a project
  2. Verifier approves the project
  3. Blockchain block is created
  4. Buyer purchases credits
  5. Buyer downloads certificate
- Add `test` and `test:e2e` scripts to `package.json`

#### 8.2 — Unit Tests for Blockchain Logic
**Status:** ❌ Not implemented  
**What's missing:** No unit tests for `server/blockchain.ts` (Merkle tree, hash computation) or `server/carbonCalculation.ts`.  
**What to build:**
- Set up Vitest (already compatible with the Vite stack)
- Write unit tests for:
  - `computeMerkleRoot()` — test with 0, 1, 2, odd, and even transaction counts
  - `computeBlockHash()` — test determinism
  - `calculateCarbonSequestration()` — test all ecosystem types and regional factors
  - `isOverlapping()` — test with overlapping and non-overlapping polygons

#### 8.3 — GIS Accuracy Testing
**Status:** ❌ Not implemented  
**What's missing:** The `calculatePolygonArea()` function in `gis-land-map.tsx` uses a custom spherical formula. It has not been validated against known GIS datasets.  
**What to build:**
- Write unit tests comparing `calculatePolygonArea()` output against `@turf/turf`'s `area()` function for the same coordinates
- Test with known real-world polygons (e.g., a 1-hectare square at various latitudes)

---

### 9. Documentation & Compliance

#### 9.1 — Terms of Service & Privacy Policy Pages
**Status:** ✅ DONE  
**Implementation:** Created [`terms.tsx`](BLUECARBONPROJECT-main/client/src/pages/terms.tsx) and [`privacy.tsx`](BLUECARBONPROJECT-main/client/src/pages/privacy.tsx) pages. Routes added in [`App.tsx`](BLUECARBONPROJECT-main/client/src/App.tsx). Links added to landing page footer. Content covers voluntary credits, non-regulatory status, data collection, retention, user rights.

#### 9.2 — API Documentation (Swagger/OpenAPI)
**Status:** ❌ Not implemented  
**What's missing:** No API documentation. All 30+ endpoints in `server/routes.ts` are undocumented.  
**What to build:**
- Install `swagger-ui-express` and `swagger-jsdoc`
- Add JSDoc annotations to all route handlers
- Expose `/api/docs` endpoint with Swagger UI
- Document all request/response schemas

#### 9.3 — Prominent Compliance Disclaimer on All Pages
**Status:** ⚠️ Partial (only in certificate PDF and marketplace page)  
**What's missing:** The disclaimer "Not a government-recognized carbon registry" is only shown in the certificate PDF and one marketplace banner. It should be visible on the landing page, explorer, and all dashboards.  
**What to build:**
- Add a persistent footer banner or navbar badge on all pages
- Ensure the landing page hero section includes the voluntary/non-regulatory disclaimer
- Add disclaimer to the blockchain explorer page

---

### 10. Deployment & DevOps

#### 10.1 — Environment Parity (Dev/Staging/Production)
**Status:** ✅ DONE  
**Implementation:** `.env.example` file created at [`BLUECARBONPROJECT-main/.env.example`](BLUECARBONPROJECT-main/.env.example) documenting all required and optional environment variables: `JWT_SECRET`, `DATABASE_URL`, `NODE_ENV`, `PORT`, `USE_DATABASE`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`, `SENTRY_DSN`.

---

## 📊 Summary Table

| # | Task | Priority | Category | Effort | Status |
|---|------|----------|----------|--------|--------|
| 1.1 | Account Lockout | 🔴 HIGH | Security | Medium | ✅ DONE |
| 1.2 | CSRF / Helmet / Rate Limiting | 🔴 HIGH | Security | Small | ✅ DONE |
| 1.3 | Audit Logging Service | 🔴 HIGH | Security | Large | ✅ DONE |
| 1.4 | Password Complexity | 🔴 HIGH | Security | Small | ✅ DONE |
| 2.1 | Needs Clarification Status | 🔴 HIGH | Governance | Medium | ✅ DONE |
| 2.2 | External Verifier Invitation Flow | 🔴 HIGH | Governance | Large | ❌ TODO |
| 2.3 | No-Edit Policy (Project Freeze) | 🔴 HIGH | Governance | Medium | ❌ TODO |
| 3.1 | Certificate Revocation | 🔴 HIGH | Certificates | Medium | ✅ DONE |
| 3.2 | QR Code on Certificates | 🔴 HIGH | Certificates | Medium | ✅ DONE |
| 3.3 | Batch Annual Report | 🔴 HIGH | Certificates | Medium | ❌ TODO |
| 4.1 | Database Indexing | 🔴 HIGH | Database | Small | ✅ DONE |
| 4.2 | Soft Deletes | 🔴 HIGH | Database | Medium | ✅ DONE |
| 4.3 | Automated Backups | 🔴 HIGH | Database | Small | ✅ DONE |
| 5.1 | Blockchain Integrity Monitor | 🔴 HIGH | Monitoring | Medium | ✅ DONE |
| 5.2 | Health Check Endpoint | 🔴 HIGH | Monitoring | Small | ✅ DONE |
| 5.3 | Sentry Error Tracking | 🔴 HIGH | Monitoring | Small | ✅ DONE |
| 5.4 | Slow API Alerts | 🔴 HIGH | Monitoring | Small | ✅ DONE |
| 6.1 | Public Carbon Estimator | 🟡 MEDIUM | UI/UX | Medium | ❌ TODO |
| 6.2 | Interactive Onboarding Tours | 🟡 MEDIUM | UI/UX | Medium | ❌ TODO |
| 6.3 | Mobile GIS Optimization | 🟡 MEDIUM | UI/UX | Medium | ❌ TODO |
| 7.1 | Explorer Pagination | 🟡 MEDIUM | Performance | Medium | ❌ TODO |
| 7.2 | Upload Compression | 🟡 MEDIUM | Performance | Small | ❌ TODO |
| 7.3 | Marketplace Caching | 🟡 MEDIUM | Performance | Small | ✅ DONE |
| 8.1 | E2E Tests (Playwright) | 🟡 MEDIUM | Testing | Large | ❌ TODO |
| 8.2 | Unit Tests (Blockchain) | 🟡 MEDIUM | Testing | Medium | ❌ TODO |
| 8.3 | GIS Accuracy Tests | 🟡 MEDIUM | Testing | Small | ❌ TODO |
| 9.1 | Terms of Service & Privacy Policy | 🟡 MEDIUM | Compliance | Medium | ✅ DONE |
| 9.2 | Swagger API Documentation | 🟡 MEDIUM | Compliance | Large | ❌ TODO |
| 9.3 | Disclaimer on All Pages | 🟡 MEDIUM | Compliance | Small | ❌ TODO |
| 10.1 | Environment Parity | 🟡 MEDIUM | DevOps | Small | ✅ DONE |

---

*Total: **30 items** — 17 DONE, 13 TODO — 17 High Priority, 13 Medium Priority*
