# BlueCarbon Ledger - API Contract

This document provides a complete reference of all backend API endpoints for the BlueCarbon Ledger platform.

---

## 1. Health & System

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| GET | `/health` | Public | - | - | `{ status, db, uptime, timestamp, environment }` |
| GET | `/api/stats` | Public | - | - | `{ totalProjects, verifiedProjects, totalCO2Captured }` |

---

## 2. Authentication

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| POST | `/api/auth/login` | Public | - | `{ email, password }` | `{ message, token, user }` |
| POST | `/api/auth/signup` | Public | - | `{ name, email, password, role }` | `{ message, token, user }` |
| GET | `/api/auth/profile` | Protected | All | - | User profile object |

---

## 3. Users & Roles

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| GET | `/api/debug/users` | Protected | admin | - | Array of all users |
| PATCH | `/api/users/:id/role` | Protected | admin | `{ role }` | `{ message, user }` |
| GET | `/api/users/verifiers` | Public | - | - | Array of verifier users |

---

## 4. Projects

| Method | Endpoint | Auth | Roles | Query Params | Request Body | Response |
|--------|----------|------|-------|--------------|--------------|----------|
| POST | `/api/projects` | Protected | contributor | - | `FormData: { name, description, location, area, ecosystemType, plantationType, landBoundary, proof }` | `{ success, project }` |
| GET | `/api/projects` | Public | - | `limit?, offset?` | - | `{ data: [Project], pagination: { total, limit, offset, hasMore } }` |
| GET | `/api/projects/my` | Protected | contributor | - | - | Array of user's projects |
| GET | `/api/projects/pending` | Protected | verifier, admin | - | - | Array of pending projects |
| GET | `/api/projects/my-reviews` | Protected | verifier, admin | - | - | Array of projects assigned to verifier |
| PUT | `/api/projects/:id/assign` | Public | - | - | `{ verifierId }` | `{ updated }` |
| POST | `/api/projects/:id/review` | Protected | verifier, admin | - | `{ action, rejectionReason?, comment?, clarificationNote? }` | `{ success, transaction? }` |
| GET | `/api/projects/:id/certificate` | Public | - | - | - | Certificate object with PDF data |
| POST | `/api/projects/:id/remove` | Protected | admin | - | - | `{ success, message }` |

---

## 5. Blockchain

| Method | Endpoint | Auth | Roles | Query Params | Response |
|--------|----------|------|-------|--------------|----------|
| GET | `/api/blocks` | Public | - | `limit?, offset?` | `{ data: [Block], pagination }` |
| GET | `/api/transactions` | Public | - | `limit?, offset?` | `{ data: [Transaction], pagination }` |
| GET | `/api/transactions/my` | Protected | All | - | User's transactions |
| GET | `/api/blockchain/export` | Public | - | - | Full blockchain with integrity |
| GET | `/api/blockchain/integrity` | Public | - | - | `{ status, errors }` |

---

## 6. Marketplace (Buyer)

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| GET | `/api/projects/marketplace` | Protected | buyer | - | Array of verified, listed projects |
| GET | `/api/buyer/filter` | Protected | buyer | Query: `credits_min?, credits_max?, plantation_type?` | Array of filtered projects |
| POST | `/api/credits/purchase` | Protected | buyer | `{ contributorId, projectId, credits, amount?, idempotencyKey? }` | `{ message, buyer, project, transaction }` |
| GET | `/api/credits/purchases` | Protected | buyer | - | Buyer's purchase history |
| GET | `/api/credits/sales` | Protected | contributor | - | Contributor's sales history |

---

## 7. Certificate Verification

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| GET | `/verify/:certificateId` | Public | - | - | Certificate verification object |

---

## 8. Verifier

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| GET | `/api/verifier/status` | Protected | verifier, admin | - | Verifier dashboard stats |

---

## 9. Object Storage

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| POST | `/api/objects/upload` | Public | - | - | `{ uploadURL }` |
| PUT | `/api/proof-files` | Public | - | `{ proofFileURL }` | `{ objectPath }` |
| GET | `/objects/:objectPath(*)` | Public | - | - | File stream |

---

## 10. Admin

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| POST | `/api/admin/backup` | Protected | admin | - | Full database backup JSON |
| POST | `/api/admin/certificates/:id/revoke` | Protected | admin | `{ reason? }` | `{ success, message, certificateId, status }` |
| GET | `/api/admin/top-buyers` | Protected | admin | - | Array of top buyers |
| GET | `/api/admin/top-contributors` | Protected | admin | - | Array of top contributors |
| GET | `/api/admin/ledger` | Protected | admin | - | Full transaction ledger |
| GET | `/api/admin/minting-status` | Protected | admin | - | `{ mintingEnabled }` |
| PATCH | `/api/admin/minting-status` | Protected | admin | `{ enabled }` | `{ success }` |
| POST | `/api/admin/warnings` | Protected | admin | `{ contributorId, message, severity }` | Warning object |
| GET | `/api/admin/warnings/:contributorId` | Protected | All | - | Array of warnings for contributor |
| POST | `/api/admin/rollback` | Protected | admin | `{ targetId, type, reason }` | `{ success }` |

---

## Authentication & Roles

### Middleware

| Middleware | Purpose |
|------------|---------|
| `requireAuth` | Validates JWT token, attaches user to request |
| `requireRole(...roles)` | Validates user has required role |

### Role Permissions

| Role | Access |
|------|--------|
| admin | All endpoints, user role management, backup, certificate revocation, warnings, rollbacks, minting control |
| verifier | Project review (approve/reject/clarify), view pending projects, view assigned reviews, verifier status |
| contributor | Submit projects, view own projects, view sales history |
| buyer | Marketplace access, purchase credits, view purchase history |
| public | Login, signup, stats, blockchain explorer, certificate verification |

---

## Frontend → API Mapping

| Frontend Page/Component | API Endpoints Used |
|-------------------------|-------------------|
| Login (login.tsx) | `POST /api/auth/login`, `POST /api/auth/signup` |
| Navbar (navbar.tsx) | `GET /api/stats` |
| User Dashboard (user-dashboard.tsx) | `GET /api/projects/my`, `GET /api/transactions/my`, `GET /api/credits/sales`, `GET /api/projects/:id/certificate` |
| Admin Dashboard (admin-dashboard.tsx) | `GET /api/stats`, `GET /api/projects`, `GET /api/users/verifiers`, `GET /api/debug/users`, `GET /api/blocks`, `PUT /api/projects/:id/assign`, `GET /api/blockchain/export`, `GET /api/admin/top-buyers`, `GET /api/admin/top-contributors`, `GET /api/admin/ledger`, `POST /api/admin/backup`, `POST /api/admin/certificates/:id/revoke`, `GET /api/admin/minting-status`, `PATCH /api/admin/minting-status`, `POST /api/admin/warnings`, `POST /api/admin/rollback` |
| Verifier Dashboard (verifier-dashboard.tsx) | `GET /api/projects/pending`, `GET /api/projects/my-reviews`, `GET /api/blocks`, `POST /api/projects/:id/review`, `GET /api/verifier/status` |
| Marketplace (marketplace.tsx) | `GET /api/projects/marketplace`, `GET /api/buyer/filter`, `GET /api/credits/purchases`, `POST /api/credits/purchase` |
| Explorer (explorer.tsx) | `GET /api/blocks`, `GET /api/transactions`, `GET /api/blockchain/integrity` |
| Project Submission (project-submission-form.tsx) | `POST /api/projects` |
| Landing (landing.tsx) | `GET /api/stats`, `GET /api/blocks` |

---

## Database Tables Referenced

| Table | Description |
|-------|-------------|
| users | User accounts with roles |
| projects | Blue carbon projects |
| transactions | Blockchain transactions |
| blocks | Blockchain blocks |
| credit_transactions | Credit purchases between buyers and contributors |
| reward_transactions | Blue Points reward ledger |
| audit_logs | Security audit trail |
| system_settings | System configuration |
| warnings | Contributor warnings |
| rollbacks | Admin rollback actions |

---

## Risk Warnings

### High Risk - Do NOT Change

1. **Certificate Verification Response Format** (`/verify/:certificateId`)
   - Frontend may depend on: `certificateId`, `status`, `projectName`, `buyerName`, `creditsPurchased`, `transactionId`

2. **Project Certificate Response** (`/api/projects/:id/certificate`)
   - Frontend uses: `projectName`, `co2Captured`, `transactionId`, `blockHash`, `certificateId`

3. **Credit Purchase Response** (`/api/credits/purchase`)
   - Frontend expects: `{ message, buyer, project, transaction }` structure

### Medium Risk

1. **Query Key Conventions** - Frontend uses React Query with specific keys
2. **User Object Shape** - All endpoints return user without password

---

## Summary

- **Total Endpoints**: 42
- **Public**: 16 (no auth required)
- **Protected**: 26 (require JWT)
- **Role-specific**: 18
- **Admin-only**: 10
