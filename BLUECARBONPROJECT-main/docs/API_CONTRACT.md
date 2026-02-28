# BlueCarbon Ledger - API Contract

This document provides a complete reference of all backend API endpoints for frontend development.

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

---

## 3. Users & Roles

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| PATCH | `/api/users/:id/role` | Protected | admin | `{ role }` | `{ message, user }` |
| GET | `/api/users/verifiers` | Public | - | - | `[ { id, name, email, role, ... } ]` |
| GET | `/api/users` | Public | - | - | `[ { id, name, email, role, ... } ]` |

---

## 4. Projects

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| POST | `/api/projects` | Protected | contributor | `FormData: { name, description, location, area, ecosystemType, plantationType, landBoundary, proof }` | `{ success, project }` |
| GET | `/api/projects` | Public | - | - | `[Project]` |
| GET | `/api/projects/my` | Protected | - | - | `[Project]` |
| GET | `/api/projects/pending` | Protected | verifier, admin | - | `[Project]` |
| GET | `/api/projects/my-reviews` | Protected | verifier | - | `[Project]` |
| PUT | `/api/projects/:id/assign` | Public | - | `{ verifierId }` | `{ updated }` |
| POST | `/api/projects/:id/review` | Protected | verifier, admin | `{ action, rejectionReason?, comment?, clarificationNote? }` | `{ success, transaction? }` |
| GET | `/api/projects/:id/certificate` | Public | - | - | Certificate object |

---

## 5. Blockchain

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| GET | `/api/blocks` | Public | - | - | `[Block]` |
| GET | `/api/transactions` | Public | - | - | `[Transaction]` |
| GET | `/api/transactions/my` | Protected | - | - | `[Transaction]` |
| GET | `/api/blockchain/export` | Public | - | - | Full blockchain export with integrity |
| GET | `/api/blockchain/integrity` | Public | - | - | `{ status, errors }` |

---

## 6. Marketplace (Buyer)

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| GET | `/api/projects/marketplace` | Protected | buyer | - | `[Project]` |
| GET | `/api/buyer/filter` | Protected | buyer | Query: `credits_min?, credits_max?, plantation_type?` | `[FilteredProject]` |
| POST | `/api/credits/purchase` | Protected | buyer | `{ contributorId, projectId, credits }` | `{ message, buyer, project, transaction }` |
| GET | `/api/credits/purchases` | Protected | buyer | - | `[CreditTransaction]` |
| GET | `/api/credits/sales` | Protected | contributor | - | `[CreditTransaction]` |

---

## 7. Certificate Verification

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| GET | `/verify/:certificateId` | Public | - | - | `{ certificateId, status, projectName, buyerName, creditsPurchased, issueDate, projectLocation, ecosystemType, transactionId }` |

---

## 8. Object Storage

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| POST | `/api/objects/upload` | Public | - | - | `{ uploadURL }` |
| PUT | `/api/proof-files` | Public | - | `{ proofFileURL }` | `{ objectPath }` |
| GET | `/objects/:objectPath(*)` | Public | - | - | File stream |

---

## 9. Admin

| Method | Endpoint | Auth | Roles | Request Body | Response |
|--------|----------|------|-------|--------------|----------|
| POST | `/api/admin/backup` | Protected | admin | - | Full database backup JSON |
| POST | `/api/admin/certificates/:id/revoke` | Protected | admin | `{ reason? }` | `{ success, message, certificateId, status }` |

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
| admin | All endpoints, user role management, backup, certificate revocation |
| verifier | Project review (approve/reject/clarify), view pending projects |
| contributor | Submit projects, view own projects, view sales history |
| buyer | Marketplace access, purchase credits, view purchase history |
| public | Login, signup, stats, blockchain explorer, certificate verification |

---

## Frontend → API Mapping

| Frontend Page/Component | API Endpoints Used |
|-------------------------|-------------------|
| login.tsx | `POST /api/auth/login`, `POST /api/auth/signup` |
| navbar.tsx | `GET /api/stats` |
| user-dashboard.tsx | `GET /api/projects/my`, `GET /api/transactions/my`, `GET /api/credits/sales`, `GET /api/projects/:id/certificate` |
| admin-dashboard.tsx | `GET /api/stats`, `GET /api/projects`, `GET /api/users/verifiers`, `GET /api/users`, `GET /api/blocks`, `PUT /api/projects/:id/assign`, `GET /api/blockchain/export` |
| verifier-dashboard.tsx | `GET /api/projects/pending`, `GET /api/projects/my-reviews`, `GET /api/blocks`, `POST /api/projects/:id/review` |
| marketplace.tsx | `GET /api/projects/marketplace`, `GET /api/buyer/filter`, `GET /api/credits/purchases`, `POST /api/credits/purchase` |
| explorer.tsx | `GET /api/blocks`, `GET /api/transactions` |
| project-submission-form.tsx | `POST /api/projects` |

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

- **Total Endpoints**: 30
- **Public**: 14 (no auth required)
- **Protected**: 16 (require JWT)
- **Role-specific**: 12
- **Admin-only**: 2
