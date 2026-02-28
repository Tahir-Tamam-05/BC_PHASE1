# Database Infrastructure Status Update (AWS RDS)

## Current Database Architecture

The project is now connected to a real AWS RDS PostgreSQL instance.

### Instance Details

- Engine: PostgreSQL
- Instance Type: db.t3.micro
- Region: us-east-1
- Publicly Accessible: Yes (IP restricted)
- SSL: Required
- Automated Backups: Enabled (7-day retention)
- Storage Billing: Active
- Compute Billing: Only when DB is running

---

## Connection Configuration

Environment Variables:

DATABASE_URL=postgresql://postgres:<password>@database-1.csdgsk26izxh.us-east-1.rds.amazonaws.com:5432/bluecarbon?sslmode=require
USE_DATABASE=true
NODE_ENV=development
PORT=5000

---

## SSL Configuration Requirement

Because AWS RDS uses its own certificate authority, Node must trust the AWS CA bundle.

Required command (per terminal session unless added to shell profile):

export NODE_EXTRA_CA_CERTS=./rds-global-bundle.pem

To make permanent:

echo 'export NODE_EXTRA_CA_CERTS=./rds-global-bundle.pem' >> ~/.zshrc

---

## Drizzle Migration Status

Schema successfully generated and migrated.

Tables created:

- users
- projects
- transactions
- blocks
- credit_transactions
- audit_logs
- __drizzle_migrations

All ENUMs, foreign keys, and constraints are active.

Atomic idempotent credit transactions implemented.

---

## Cost Strategy

To reduce AWS billing:

Stop DB when not developing:

RDS → Databases → database-1 → Actions → Stop

Start when needed:

RDS → Databases → database-1 → Actions → Start

While stopped:
- No instance hourly cost
- Storage cost remains (~$2/month)

---

## Data Persistence Status

Database is now persistent.

Data survives:
- Server restarts
- Local machine restarts
- Deployment changes

In-memory storage is no longer primary storage.
