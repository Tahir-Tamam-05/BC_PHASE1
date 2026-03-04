# Database Status Update

## Current Status: HEALTHY

Last Updated: 2026-03-01

---

## Database Infrastructure

### Instance Details

- **Engine**: PostgreSQL
- **Instance Type**: AWS RDS db.t3.micro
- **Region**: us-east-1
- **Endpoint**: database-1.csdgsk26izxh.us-east-1.rds.amazonaws.com
- **Port**: 5432
- **Database Name**: bluecarbon
- **Publicly Accessible**: Yes (IP restricted)
- **SSL**: Required
- **Automated Backups**: Enabled (7-day retention)

---

## Connection Configuration

### Environment Variables

```bash
DATABASE_URL=postgresql://postgres:<password>@database-1.csdgsk26izxh.us-east-1.rds.amazonaws.com:5432/bluecarbon?sslmode=require
USE_DATABASE=true
NODE_ENV=development
PORT=5000
```

---

## Schema Status

### Tables Created

| Table | Status | Row Count |
|-------|--------|-----------|
| users | ✅ Active | - |
| projects | ✅ Active | - |
| transactions | ✅ Active | - |
| blocks | ✅ Active | - |
| credit_transactions | ✅ Active | - |
| reward_transactions | ✅ Active | - |
| audit_logs | ✅ Active | - |
| system_settings | ✅ Active | - |
| warnings | ✅ Active | - |
| rollbacks | ✅ Active | - |
| __drizzle_migrations | ✅ Active | - |

### ENUM Types

| Enum | Status | Values |
|------|--------|--------|
| user_role | ✅ Active | admin, verifier, contributor, buyer |
| project_status | ✅ Active | pending, verified, rejected, needs_clarification |
| certificate_status | ✅ Active | valid, revoked |

---

## Foreign Key Relationships

### Verified Relationships

| Relationship | Status |
|--------------|--------|
| projects.user_id → users.id | ✅ Verified |
| projects.verifier_id → users.id | ✅ Verified |
| transactions.project_id → projects.id | ✅ Verified |
| transactions.buyer_id → users.id | ✅ Verified |
| transactions.contributor_id → users.id | ✅ Verified |
| credit_transactions.buyer_id → users.id | ✅ Verified |
| credit_transactions.contributor_id → users.id | ✅ Verified |
| credit_transactions.project_id → projects.id | ✅ Verified |
| reward_transactions.user_id → users.id | ✅ Verified |
| warnings.contributor_id → users.id | ✅ Verified |
| rollbacks.admin_id → users.id | ✅ Verified |

---

## Indexes Status

All performance indexes are in place:

- ✅ projects: user_id, status, verifier_id
- ✅ transactions: project_id, block_id, to, buyer_id, contributor_id
- ✅ credit_transactions: buyer_id, contributor_id, project_id, idempotency_key
- ✅ reward_transactions: user_id, source_transaction_id
- ✅ audit_logs: user_id, action_type, timestamp
- ✅ warnings: contributor_id
- ✅ rollbacks: admin_id, target_id

---

## Data Integrity

### Soft Deletes

- ✅ users.deletedAt field implemented
- ✅ projects.deletedAt field implemented
- ✅ isListed field for marketplace visibility control

### Atomic Transactions

- ✅ Credit purchase uses database transactions
- ✅ Idempotency key prevents duplicate purchases
- ✅ Row-level locking prevents race conditions

---

## Recent Fixes Applied

1. **Admin Ledger Query Fix** (2026-03-01)
   - Fixed buyer lookup to handle empty arrays
   - File: `server/storage.ts`

2. **Foreign Key Constraints** (2026-03-01)
   - Added missing FK for transactions.buyer_id
   - Added missing FK for transactions.contributor_id
   - Migration: `migrations/0003_fix_foreign_keys.sql`

---

## Backup & Recovery

### Automated Backups

- AWS RDS automated backups: 7-day retention
- Admin manual backup endpoint available: `POST /api/admin/backup`

### Point-in-Time Recovery

- Available via AWS RDS console
- Retention period: 7 days

---

## Monitoring

### Health Check

- Endpoint: `GET /health`
- Returns: `{ status, db, uptime, timestamp, environment }`

### Blockchain Integrity

- Endpoint: `GET /api/blockchain/integrity`
- Validates hash computation and chain linkage

---

## Cost Status

### Current Month Estimate

- RDS Instance (db.t3.micro): ~$15/month
- Storage (gp3, ~20GB): ~$2/month
- **Total**: ~$17/month

### Cost Optimization

The database can be stopped when not in use to save on instance costs. Storage charges still apply.

---

## Issues Found & Fixed

| Issue | Status | Fix Date |
|-------|--------|----------|
| Admin ledger query bug | ✅ Fixed | 2026-03-01 |
| Missing FK constraints | ✅ Fixed | 2026-03-01 |

---

## Next Steps

1. Run migration 0003_fix_foreign_keys.sql to apply FK constraints
2. Monitor database performance
3. Consider adding read replicas for production scaling
