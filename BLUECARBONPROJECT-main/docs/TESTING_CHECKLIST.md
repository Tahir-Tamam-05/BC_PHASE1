# BlueCarbon Ledger - Testing Checklist

> **Test Environment:** Local Development
> **Date:** 2026-03-01
> **Pre-requisites:** Server running on http://localhost:5000

---

## 1. Authentication

### 1.1 Registration
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 1.1.1 | Navigate to `/login` | Login page loads | ☐ |
| 1.1.2 | Click "Create Account" | Registration form appears | ☐ |
| 1.1.3 | Fill form with valid Gmail, password (8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special), select role | Form validates in real-time | ☐ |
| 1.1.4 | Submit registration | Redirect to role-specific dashboard | ☐ |

### 1.2 Login
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 1.2.1 | Login with valid credentials | Successful login, JWT token stored | ☐ |
| 1.2.2 | Login with wrong password | Error message shown | ☐ |
| 1.2.3 | Login with non-existent email | Error message shown | ☐ |

### 1.3 Account Security
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 1.3.1 | Test account lockout after 5 failed attempts | Account locked for 15 minutes | ☐ |
| 1.3.2 | Test password complexity validation | Weak passwords rejected | ☐ |

---

## 2. Contributor Flow

### 2.1 Project Submission
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 2.1.1 | On Contributor Dashboard, click "Submit Project" | Project submission form loads | ☐ |
| 2.1.2 | Fill: Project Name, Description, Location, Area (hectares), Ecosystem Type | Fields accept input | ☐ |
| 2.1.3 | Draw GIS boundary on map (minimum 3 points) | Polygon renders on map | ☐ |
| 2.1.4 | Upload proof document (PDF/image) | File upload succeeds | ☐ |
| 2.1.5 | Submit project | Project saved, status shows "Pending" | ☐ |
| 2.1.6 | Verify CO₂ calculation is displayed | Annual and lifetime CO₂ shown | ☐ |

### 2.2 Project Monitoring
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 2.2.1 | View dashboard "My Projects" | Submitted project appears in list | ☐ |
| 2.2.2 | Check project status badge | Shows "Pending" (amber) | ☐ |
| 2.2.3 | If clarified: Check for clarification message | Blue "Needs Clarification" badge | ☐ |
| 2.2.4 | After verification: View earned credits | Credits shown in project card | ☐ |

### 2.3 Sales History
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 2.3.1 | View sales history | List of credit sales displayed | ☐ |
| 2.3.2 | Download certificate for completed sale | PDF certificate downloads | ☐ |

---

## 3. Verifier Flow

### 3.1 Verifier Login
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 3.1.1 | Login as verifier (email: verifier1@bluecarbon.com, password: verifier123) | Redirect to Verifier Dashboard | ☐ |
| 3.1.2 | View "Pending Projects" tab | List of projects awaiting review | ☐ |
| 3.1.3 | Cannot see own submitted projects in queue | COI check working | ☐ |

### 3.2 Project Review
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 3.2.1 | Click on a pending project | Project details modal/page opens | ☐ |
| 3.2.2 | Review GIS boundary, uploaded documents | All details visible | ☐ |
| 3.2.3 | Click "Approve" | Project status changes to "Verified" (green), block created | ☐ |
| 3.2.4 | Verify blockchain transaction created | Block added, transaction recorded | ☐ |
| 3.2.5 | Test "Reject" with reason code | Project status "Rejected" (red), reason stored | ☐ |
| 3.2.6 | Test "Request Clarification" | Status "Needs Clarification" (blue), note saved | ☐ |
| 3.2.7 | Cannot re-verify a verified project | Appropriate error shown | ☐ |

### 3.3 Verifier Dashboard
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 3.3.1 | View assigned reviews | List of projects assigned to verifier | ☐ |
| 3.3.2 | View verification statistics | Stats displayed correctly | ☐ |

---

## 4. Buyer Flow

### 4.1 Buyer Registration
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 4.1.1 | Register new account as "Buyer" role | Account created successfully | ☐ |
| 4.1.2 | Navigate to Marketplace | Access granted | ☐ |

### 4.2 Credit Purchase
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 4.2.1 | Navigate to Marketplace | Verified projects displayed | ☐ |
| 4.2.2 | Filter by credits/plantation type | Results filter correctly | ☐ |
| 4.2.3 | Click "Purchase" on a project | Purchase modal opens | ☐ |
| 4.2.4 | Enter credits to purchase (cannot exceed available) | Validation prevents over-purchase | ☐ |
| 4.2.5 | Confirm purchase | Credits transferred, transaction recorded | ☐ |
| 4.2.6 | Check buyer dashboard | Credits shown in purchase history | ☐ |
| 4.2.7 | Check contributor dashboard | Credits deducted from available | ☐ |
| 4.2.8 | Test duplicate purchase prevention | Idempotency works | ☐ |

### 4.3 Certificate Download
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 4.3.1 | In purchase history, click "Download Certificate" | PDF certificate generated | ☐ |
| 4.3.2 | Verify certificate contains: Project name, CO₂ captured, buyer name, date, blockchain TX ID | All fields present | ☐ |
| 4.3.3 | Verify disclaimer shown | "Voluntary carbon offset - not government recognized" | ☐ |

---

## 5. Certificate Verification

### 5.1 Public Verification
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 5.1.1 | Navigate to `/verify/:certificateId` | Verification page loads | ☐ |
| 5.1.2 | Enter certificate ID or transaction ID | Certificate details displayed | ☐ |
| 5.1.3 | Verify shows correct project, credits, buyer, date | Data matches certificate | ☐ |

### 5.2 Revoked Certificate
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 5.2.1 | Admin revokes certificate | Certificate marked as revoked | ☐ |
| 5.2.2 | Verify revoked certificate | Shows "REVOKED" status | ☐ |

---

## 6. Blockchain Explorer

### 6.1 Block Viewing
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 6.1.1 | Navigate to `/explorer` | Explorer page loads | ☐ |
| 6.1.2 | View list of blocks | Blocks displayed with index, hash, timestamp | ☐ |
| 6.1.3 | Click on a block | Block details modal shows transactions | ☐ |
| 6.1.4 | Verify genesis block (index 0) | Previous hash is "0" | ☐ |

### 6.2 Transaction Viewing
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 6.2.1 | View transactions list | All transactions displayed | ☐ |
| 6.2.2 | Click on transaction | Details: from, to, credits, project, timestamp | ☐ |

### 6.3 Hash Verification
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 6.3.1 | Use "Verify Hash" tool | Tool accessible in explorer | ☐ |
| 6.3.2 | Enter data and expected hash | Correct hash verifies, wrong hash fails | ☐ |

### 6.4 Chain Integrity
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 6.4.1 | Call `/api/blockchain/integrity` endpoint | Returns "verified" or "tampered" | ☐ |
| 6.4.2 | Verify export includes integrity status | Export shows integrity field | ☐ |

---

## 7. Admin Functions

### 7.1 Admin Dashboard Access
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 7.1.1 | Login as admin (email: admin@bluecarbon.com, password: admin123) | Admin Dashboard loads | ☐ |
| 7.1.2 | View admin tabs: Users, Projects, Blockchain Export, Ledger | All tabs accessible | ☐ |

### 7.2 User Management
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 7.2.1 | View all users | List with roles displayed | ☐ |
| 7.2.2 | Change user role | Role updated successfully | ☐ |
| 7.2.3 | Cannot change own role | Error prevented | ☐ |

### 7.3 Backup
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 7.3.1 | Call `POST /api/admin/backup` (admin only) | JSON file downloads | ☐ |
| 7.3.2 | Verify backup contains all tables | Users, projects, transactions, blocks, credits, audit logs | ☐ |
| 7.3.3 | Verify passwords are sanitized | No password hashes in export | ☐ |
| 7.3.4 | Non-admin gets 403 | Authorization enforced | ☐ |

### 7.4 Minting Control
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 7.4.1 | Check minting status | Current status displayed | ☐ |
| 7.4.2 | Toggle minting enabled/disabled | Status updates | ☐ |

### 7.5 Warnings
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 7.5.1 | Issue warning to contributor | Warning created | ☐ |
| 7.5.2 | View warnings | Warnings list displayed | ☐ |

### 7.6 Rollbacks
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 7.6.1 | Perform rollback action | Rollback recorded, transaction marked | ☐ |
| 7.6.2 | View rollback history | Rollback list displayed | ☐ |

### 7.7 Certificate Revocation
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 7.7.1 | Revoke a certificate | Certificate marked as revoked | ☐ |
| 7.7.2 | Cannot double-revoke | Error shown | ☐ |

---

## 8. Security

### 8.1 Authentication
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 8.1.1 | Access protected route without token | Redirected to login | ☐ |
| 8.1.2 | Access admin route as non-admin | 403 Forbidden | ☐ |
| 8.1.3 | Access marketplace as non-buyer | Access denied | ☐ |

### 8.2 Rate Limiting
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 8.2.1 | Make 20+ login attempts rapidly | Rate limit triggered (429) | ☐ |

### 8.3 Health Check
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 8.3.1 | Call `GET /health` | Returns { status, db, uptime, timestamp } | ☐ |

### 8.4 Audit Logging
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 8.4.1 | Perform action (login, project review, purchase) | Action logged in audit_logs | ☐ |

---

## 9. Performance

### 9.1 Caching
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 9.1.1 | Call marketplace endpoint twice | Second call faster (cached) | ☐ |
| 9.1.2 | Make purchase, then access marketplace | Fresh data (cache invalidated) | ☐ |

### 9.2 Slow API Alerts
| Step | Action | Expected Result | Pass |
|------|--------|----------------|------|
| 9.2.1 | Make slow request (>500ms) | Warning logged in server | ☐ |

---

## Summary

| Category | Total Tests | Passed | Failed |
|----------|-------------|--------|--------|
| Authentication | 6 | | |
| Contributor Flow | 9 | | |
| Verifier Flow | 9 | | |
| Buyer Flow | 11 | | |
| Certificate Verification | 5 | | |
| Blockchain Explorer | 7 | | |
| Admin Functions | 14 | | |
| Security | 4 | | |
| Performance | 2 | | |
| **TOTAL** | **67** | | |

### Issues Found
| # | Issue Description | Severity | Steps to Reproduce |
|---|-------------------|----------|-------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---
