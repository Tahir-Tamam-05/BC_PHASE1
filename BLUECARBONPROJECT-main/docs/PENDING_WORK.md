# BlueCarbon Ledger - Pending Work Analysis

> **Analysis Date:** 2026-03-01
> **Codebase Reviewed:** `BLUECARBONPROJECT-main/`
> **Basis:** Code analysis of routes.ts, storage.ts, schema.ts, and client pages

---

## Implemented Features

### Authentication & Security

| Feature | Status | Implementation |
|---------|--------|----------------|
| JWT Authentication | ✅ Done | `server/auth.ts` - JWT tokens with expiry |
| Password Hashing | ✅ Done | bcrypt with 12 rounds |
| Role-Based Middleware | ✅ Done | `requireAuth`, `requireRole` in `server/routes.ts` |
| Account Lockout | ✅ Done | 5 failed attempts = 15 min lockout |
| Password Complexity | ✅ Done | 8+ chars, uppercase, lowercase, digit, special |
| Rate Limiting | ✅ Done | 20 auth attempts/15min, 200 API/min |
| CSRF/Helmet | ✅ Done | `server/index.ts` - helmet middleware |
| Audit Logging | ✅ Done | `auditLogs` table + `server/auditLog.ts` |

### Verification & Governance

| Feature | Status | Implementation |
|---------|--------|----------------|
| Project Status: needs_clarification | ✅ Done | Schema + StatusBadge component |
| Verifier COI Check | ✅ Done | Cannot review own project |
| Rejection Reason Codes | ✅ Done | Standardized enum in schema |
| GIS Overlap Detection | ✅ Done | `@turf/turf` - isOverlapping() |
| GIS Area Validation | ✅ Done | 15% variance threshold |

### Reporting & Certificates

| Feature | Status | Implementation |
|---------|--------|----------------|
| Certificate Revocation | ✅ Done | `certificateStatus` field, admin endpoint |
| QR Code on Certificates | ✅ Done | `certificate-generator.tsx` |
| PDF Certificate | ✅ Done | jsPDF with project details |
| Public Verification | ✅ Done | `/verify/:certificateId` endpoint |

### Database

| Feature | Status | Implementation |
|---------|--------|----------------|
| Database Indexing | ✅ Done | All critical columns indexed |
| Soft Deletes | ✅ Done | `deletedAt` on users/projects |
| Automated Backups | ✅ Done | `/api/admin/backup` endpoint |
| Atomic Transactions | ✅ Done | purchaseCredits() uses transactions |
| Idempotency | ✅ Done | `idempotencyKey` on credit_transactions |

### Blockchain

| Feature | Status | Implementation |
|---------|--------|----------------|
| SHA-256 Hashing | ✅ Done | `server/blockchain.ts` |
| Merkle Tree | ✅ Done | `computeMerkleRoot()` |
| Block Chaining | ✅ Done | `previousHash` linkage |
| Validator Signatures | ✅ Done | `validatorSignature` on blocks |
| Chain Integrity Check | ✅ Done | `/api/blockchain/integrity` |

### Monitoring

| Feature | Status | Implementation |
|---------|--------|----------------|
| Health Check | ✅ Done | `/health` endpoint |
| Sentry Integration | ✅ Done | Optional `@sentry/node` |
| Slow API Alerts | ✅ Done | 500ms threshold in `server/index.ts` |

### UI/UX

| Feature | Status | Implementation |
|---------|--------|----------------|
| Landing Page | ✅ Done | `landing.tsx`, `LandingPremium.tsx` |
| GIS Mapping | ✅ Done | Leaflet + leaflet-draw |
| Marketplace | ✅ Done | Filter + purchase flow |
| Blockchain Explorer | ✅ Done | Blocks + transactions view |
| Role-Based Dashboards | ✅ Done | Admin, Verifier, Buyer, Contributor |

### Compliance

| Feature | Status | Implementation |
|---------|--------|----------------|
| Terms of Service | ✅ Done | `terms.tsx` |
| Privacy Policy | ✅ Done | `privacy.tsx` |
| Compliance Disclaimer | ✅ Done | Certificate PDF + marketplace |

---

## Pending Work

### HIGH PRIORITY

#### 1. External Verifier Invitation Flow
**Status:** Not Implemented
- Verifiers can only be created via database seeding
- No invitation flow for third-party NGOs

**What to build:**
- `POST /api/admin/invite-verifier` endpoint
- `invitations` table: id, email, token, role, expiresAt, usedAt
- `/register/verifier?token=xxx` frontend page
- Admin UI for invitation management

#### 2. Project Edit Policy (No-Edit Freeze)
**Status:** Partial
- No PUT endpoint for project edits exists
- Freeze logic incomplete for pending/needs_clarification projects

**What to build:**
- Explicit freeze: once submitted, core fields cannot change
- Add "withdrawn" status for contributor-initiated withdrawal
- PUT endpoint with strict freeze checks

#### 3. Batch Certificate / Annual Report
**Status:** Not Implemented
- Individual certificates available
- No consolidated annual report

**What to build:**
- "Download Annual Report" button
- Multi-page PDF with all purchases for year
- Summary: total credits, projects supported, CO₂ offset

#### 4. Disclaimer on All Pages
**Status:** Partial
- Disclaimer only in certificate PDF and marketplace

**What to build:**
- Persistent footer banner on all pages
- Landing page hero disclaimer
- Explorer page disclaimer

### MEDIUM PRIORITY

#### 5. Public Carbon Estimator Tool
**Status:** Not Implemented
- No estimator on landing page

**What to build:**
- New section with form: ecosystem type, area, location
- Output: estimated annual/20-year CO₂
- CTA to register after showing results

#### 6. Interactive Onboarding Tours
**Status:** Not Implemented
- No onboarding for new users

**What to build:**
- First login detection
- Step-by-step modal tour
- Different flows for Contributor/Buyer

#### 7. Mobile GIS Optimization
**Status:** Partial
- Leaflet responsive but not mobile-optimized

**What to build:**
- Touch event handling improvements
- Larger touch targets for draw tools
- Responsive marketplace cards

#### 8. Blockchain Explorer Pagination
**Status:** ✅ DONE
**Implementation:** Added pagination to `/api/blocks` and `/api/transactions` with `limit` and `offset` query parameters. Also added to `/api/projects`. Response includes pagination metadata.

#### 9. Image/Document Compression
**Status:** Not Implemented
- Raw files uploaded without compression

**What to build:**
- Client-side compression
- File size limit (10MB)
- Show before/after sizes

#### 10. E2E Tests (Playwright/Cypress)
**Status:** Not Implemented
- No test files exist

**What to build:**
- Set up Playwright or Cypress
- Test critical flows
- Add test scripts to package.json

#### 11. Unit Tests (Blockchain)
**Status:** Not Implemented
- No unit tests for core logic

**What to build:**
- Vitest setup
- Test Merkle root computation
- Test hash computation
- Test carbon calculations
- Test GIS overlap detection

#### 12. GIS Accuracy Tests
**Status:** Not Implemented
- Area calculation not validated

**What to build:**
- Compare with `@turf/turf` area()
- Test with known polygons

#### 13. Swagger API Documentation
**Status:** Not Implemented
- No OpenAPI documentation

**What to build:**
- swagger-ui-express setup
- JSDoc annotations
- `/api/docs` endpoint

---

## Summary Table

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Account Lockout | HIGH | ✅ DONE |
| 2 | CSRF / Helmet / Rate Limiting | HIGH | ✅ DONE |
| 3 | Audit Logging | HIGH | ✅ DONE |
| 4 | Password Complexity | HIGH | ✅ DONE |
| 5 | Needs Clarification Status | HIGH | ✅ DONE |
| 6 | External Verifier Invitation | HIGH | ❌ TODO |
| 7 | No-Edit Policy | HIGH | ❌ TODO |
| 8 | Certificate Revocation | HIGH | ✅ DONE |
| 9 | QR Code on Certificates | HIGH | ✅ DONE |
| 10 | Batch Annual Report | HIGH | ❌ TODO |
| 11 | Database Indexing | HIGH | ✅ DONE |
| 12 | Soft Deletes | HIGH | ✅ DONE |
| 13 | Automated Backups | HIGH | ✅ DONE |
| 14 | Blockchain Integrity Monitor | HIGH | ✅ DONE |
| 15 | Health Check | HIGH | ✅ DONE |
| 16 | Sentry | HIGH | ✅ DONE |
| 17 | Slow API Alerts | HIGH | ✅ DONE |
| 18 | Public Carbon Estimator | MEDIUM | ❌ TODO |
| 19 | Onboarding Tours | MEDIUM | ❌ TODO |
| 20 | Mobile GIS Optimization | MEDIUM | ❌ TODO |
| 21 | Explorer Pagination | MEDIUM | ✅ DONE |
| 22 | Upload Compression | MEDIUM | ❌ TODO |
| 23 | Marketplace Caching | MEDIUM | ✅ DONE |
| 24 | E2E Tests | MEDIUM | ❌ TODO |
| 25 | Unit Tests | MEDIUM | ❌ TODO |
| 26 | GIS Accuracy Tests | MEDIUM | ❌ TODO |
| 27 | Terms of Service | MEDIUM | ✅ DONE |
| 28 | Swagger API Docs | MEDIUM | ❌ TODO |
| 29 | Disclaimer on All Pages | MEDIUM | ❌ TODO |
| 30 | Environment Parity | MEDIUM | ✅ DONE |

---

**Total: 30 items**
- ✅ DONE: 18
- ❌ TODO: 12
