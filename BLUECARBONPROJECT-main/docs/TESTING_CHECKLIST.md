# Blue Carbon Ledger — Manual Testing Checklist

> **Test Environment:** Local Development  
> **Date:** 2026-02-24  
> **Pre-requisites:** Server running on http://localhost:5173 (dev mode)

---

## 1. Contributor Flow

### 1.1 Registration & Login
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1.1.1 | Navigate to `/login` | Login page loads with form | ☐ |
| 1.1.2 | Click "Create Account" / Register | Registration form appears | ☐ |
| 1.1.3 | Fill form: Name, Gmail email, password (8+ chars, 1 uppercase, 1 number, 1 special), select "Contributor" | Form validates in real-time | ☐ |
| 1.1.4 | Submit registration | Redirect to Contributor Dashboard | ☐ |
| 1.1.5 | Log out and log back in with credentials | Successful login, redirect to dashboard | ☐ |
| 1.1.6 | Test invalid login (wrong password) | Error message shown | ☐ |
| 1.1.7 | Test account lockout after 5 failed attempts | Account locked for 15 minutes | ☐ |

### 1.2 Project Submission
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1.2.1 | On Contributor Dashboard, click "Submit Project" | Project submission form loads | ☐ |
| 1.2.2 | Fill: Project Name, Description, Location, Area (hectares), Ecosystem Type | Fields accept input | ☐ |
| 1.2.3 | Draw GIS boundary on map (minimum 3 points) | Polygon renders on map | ☐ |
| 1.2.4 | Upload proof document (PDF/image) | File upload succeeds | ☐ |
| 1.2.5 | Submit project | Project saved, status shows "Pending" | ☐ |
| 1.2.6 | Verify CO₂ calculation is displayed | Annual and lifetime CO₂ shown | ☐ |

### 1.3 Project Monitoring
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 1.3.1 | View dashboard "My Projects" | Submitted project appears in list | ☐ |
| 1.3.2 | Check project status badge | Shows "Pending" (amber) | ☐ |
| 1.3.3 | If clarified: Check for clarification message | Blue "Needs Clarification" badge, note visible | ☐ |
| 1.3.4 | After verification: View earned credits | Credits shown in project card | ☐ |

---

## 2. Verifier Flow

### 2.1 Verifier Login
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 2.1.1 | Login as verifier (email: verifier1@bluecarbon.com, password: verifier123) | Redirect to Verifier Dashboard | ☐ |
| 2.1.2 | View "Pending Projects" tab | List of projects awaiting review | ☐ |
| 2.1.3 | Cannot see own submitted projects in queue | COI check working | ☐ |

### 2.2 Project Review
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 2.2.1 | Click on a pending project | Project details modal/page opens | ☐ |
| 2.2.2 | Review GIS boundary, uploaded documents | All details visible | ☐ |
| 2.2.3 | Click "Approve" | Project status changes to "Verified" (green) | ☐ |
| 2.2.4 | Verify blockchain transaction created | Block added, transaction recorded | ☐ |
| 2.2.5 | Test "Reject" with reason code | Project status "Rejected" (red), reason stored | ☐ |
| 2.2.6 | Test "Request Clarification" | Status "Needs Clarification" (blue), note saved | ☐ |
| 2.2.7 | Cannot re-verify a verified project | Appropriate error shown | ☐ |

---

## 3. Buyer Purchase Flow

### 3.1 Buyer Registration
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 3.1.1 | Register new account as "Buyer" role | Account created successfully | ☐ |
| 3.1.2 | Navigate to Marketplace | Access denied (buyer role required) | ☐ |
| 3.1.3 | Login as buyer | Redirect to Buyer Dashboard | ☐ |

### 3.2 Credit Purchase
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 3.2.1 | Navigate to Marketplace | Verified projects displayed | ☐ |
| 3.2.2 | Filter by credits/plantation type | Results filter correctly | ☐ |
| 3.2.3 | Click "Purchase" on a project | Purchase modal opens | ☐ |
| 3.2.4 | Enter credits to purchase (cannot exceed available) | Validation prevents over-purchase | ☐ |
| 3.2.5 | Confirm purchase | Credits transferred, transaction recorded | ☐ |
| 3.2.6 | Check buyer dashboard | Credits shown in purchase history | ☐ |
| 3.2.7 | Check contributor dashboard | Credits deducted from available | ☐ |

### 3.3 Certificate Download
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 3.3.1 | In purchase history, click "Download Certificate" | PDF certificate generated | ☐ |
| 3.3.2 | Verify certificate contains: Project name, CO₂ captured, buyer name, date, blockchain TX ID | All fields present | ☐ |
| 3.3.3 | Verify disclaimer shown | "Voluntary carbon offset - not government recognized" | ☐ |

---

## 4. Certificate Verification

### 4.1 Public Verification (if implemented)
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 4.1.1 | Navigate to public verification URL (if exists) | Verification page loads | ☐ |
| 4.1.2 | Enter certificate ID or transaction ID | Certificate details displayed | ☐ |
| 4.1.3 | Verify shows correct project, credits, buyer, date | Data matches certificate | ☐ |

---

## 5. Blockchain Explorer

### 5.1 Block Viewing
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 5.1.1 | Navigate to `/explorer` or "Blockchain Explorer" | Explorer page loads | ☐ |
| 5.1.2 | View list of blocks | Blocks displayed with index, hash, timestamp | ☐ |
| 5.1.3 | Click on a block | Block details modal shows transactions | ☐ |
| 5.1.4 | Verify genesis block (index 0) | Previous hash is "0" | ☐ |

### 5.2 Transaction Viewing
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 5.2.1 | View transactions list | All transactions displayed | ☐ |
| 5.2.2 | Click on transaction | Details: from, to, credits, project, timestamp | ☐ |
| 5.2.3 | Verify Merkle proof validation works | Proof hash can be verified | ☐ |

### 5.3 Hash Verification
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 5.3.1 | Use "Verify Hash" tool | Tool accessible in explorer | ☐ |
| 5.3.2 | Enter data and expected hash | Correct hash verifies, wrong hash fails | ☐ |

### 5.4 Chain Integrity
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 5.4.1 | Call `/api/blockchain/integrity` endpoint | Returns "verified" or "tampered" | ☐ |
| 5.4.2 | Verify export includes integrity status | Export shows integrity field | ☐ |

---

## 6. Admin Functions

### 6.1 Admin Dashboard Access
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 6.1.1 | Login as admin (email: admin@bluecarbon.com, password: admin123) | Admin Dashboard loads | ☐ |
| 6.1.2 | View admin tabs: Users, Projects, Blockchain Export | All tabs accessible | ☐ |

### 6.2 User Management
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 6.2.1 | View all users | List with roles displayed | ☐ |
| 6.2.2 | Change user role | Role updated successfully | ☐ |
| 6.2.3 | Cannot change own role | Error prevented | ☐ |

### 6.3 Backup Endpoint
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 6.3.1 | Call `POST /api/admin/backup` (admin only) | JSON file downloads | ☐ |
| 6.3.2 | Verify backup contains all tables | Users, projects, transactions, blocks, credits, audit logs | ☐ |
| 6.3.3 | Verify passwords are sanitized | No password hashes in export | ☐ |
| 6.3.4 | Non-admin gets 403 | Authorization enforced | ☐ |

### 6.4 Audit Logs
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 6.4.1 | Perform action (login, project review, purchase) | Action logged | ☐ |
| 6.4.2 | View audit logs (if admin UI exists) | Logs displayed with timestamps | ☐ |

---

## 7. Security & Compliance

### 7.1 Authentication
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 7.1.1 | Access protected route without token | Redirected to login | ☐ |
| 7.1.2 | Access admin route as non-admin | 403 Forbidden | ☐ |
| 7.1.3 | Access marketplace as non-buyer | Access denied | ☐ |

### 7.2 Rate Limiting
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 7.2.1 | Make 20+ login attempts rapidly | Rate limit triggered (429) | ☐ |

### 7.3 Health Check
| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| 7.3.1 | Call `GET /health` | Returns { status, db, uptime, timestamp } | ☐ |

---

## Summary

| Category | Total Tests | Passed | Failed |
|----------|-------------|--------|--------|
| Contributor Flow | 13 | | |
| Verifier Flow | 8 | | |
| Buyer Purchase | 11 | | |
| Certificate Verification | 3 | | |
| Blockchain Explorer | 9 | | |
| Admin Functions | 8 | | |
| Security & Compliance | 5 | | |
| **TOTAL** | **57** | | |

### Issues Found
| # | Issue Description | Severity | Steps to Reproduce |
|---|-------------------|----------|-------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---
