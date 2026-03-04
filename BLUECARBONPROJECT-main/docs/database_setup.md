# Database Setup Guide

## Overview

The BlueCarbon Ledger uses PostgreSQL as its primary database, managed through Drizzle ORM. The database stores all application data including users, projects, transactions, blockchain data, and administrative records.

---

## Database Connection

### Environment Variables

Create a `.env` file in the project root with the following:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:<password>@<host>:<port>/bluecarbon?sslmode=require
USE_DATABASE=true

# Application Settings
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key
```

### SSL Configuration (AWS RDS)

When connecting to AWS RDS, Node must trust the AWS certificate authority.

Run this once per terminal session:
```bash
export NODE_EXTRA_CA_CERTS=./rds-global-bundle.pem
```

To make it permanent on macOS (zsh):
```bash
echo 'export NODE_EXTRA_CA_CERTS=./rds-global-bundle.pem' >> ~/.zshrc
```

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| users | User accounts with roles (admin, verifier, contributor, buyer) |
| projects | Blue carbon projects submitted by contributors |
| transactions | Blockchain transactions recording credit transfers |
| blocks | Blockchain blocks containing transactions |
| credit_transactions | Credit purchases between buyers and contributors |
| reward_transactions | Blue Points reward ledger for buyers and contributors |
| audit_logs | Security audit trail for all sensitive actions |
| system_settings | System configuration (e.g., minting status) |
| warnings | Warnings issued to contributors by admins |
| rollbacks | Admin rollback actions for corrections |

### ENUM Types

| Enum | Values |
|------|--------|
| user_role | admin, verifier, contributor, buyer |
| project_status | pending, verified, rejected, needs_clarification |
| certificate_status | valid, revoked |

---

## Table Schemas

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID |
| name | text | NOT NULL | User's display name |
| email | text | NOT NULL, UNIQUE | User's email address |
| password | text | NOT NULL | Bcrypt hashed password |
| role | user_role | NOT NULL | User role |
| username | text | NULLABLE | Optional legacy username |
| location | text | NULLABLE | User's location |
| creditsPurchased | real | DEFAULT 0 | Total credits purchased (buyers) |
| rewardPoints | real | DEFAULT 0 | Blue Points reward balance |
| deletedAt | timestamp | NULLABLE | Soft delete timestamp |

### projects

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID |
| name | text | NOT NULL | Project name |
| description | text | NOT NULL | Project description |
| location | text | NOT NULL | Project location |
| area | real | NOT NULL | Area in hectares |
| ecosystemType | text | NOT NULL | Mangrove, Seagrass, Salt Marsh, Coastal, Other |
| plantationType | text | NULLABLE | Type of plantation |
| annualCO2 | real | NOT NULL | Annual CO2 sequestration (tons) |
| lifetimeCO2 | real | NOT NULL | 20-year total CO2 (tons) |
| co2Captured | real | NOT NULL | Legacy field, same as lifetimeCO2 |
| creditsEarned | real | DEFAULT 0 | Credits available for sale |
| status | project_status | NOT NULL | Project verification status |
| userId | varchar | FOREIGN KEY → users.id | Project owner |
| proofFileUrl | text | NULLABLE | URL to proof documents |
| verifierId | varchar | FOREIGN KEY → users.id | Assigned verifier |
| rejectionReason | text | NULLABLE | Reason if rejected |
| clarificationNote | text | NULLABLE | Clarification request message |
| submittedAt | timestamp | NOT NULL | Submission timestamp |
| landBoundary | text | NULLABLE | GIS polygon as JSON |
| isListed | boolean | DEFAULT true | Visible in marketplace |
| deletedAt | timestamp | NULLABLE | Soft delete timestamp |

### transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID |
| txId | text | NOT NULL, UNIQUE | Transaction ID |
| from | text | NOT NULL | Sender address |
| to | text | NOT NULL | Recipient address |
| credits | real | NOT NULL | Credit amount |
| projectId | varchar | FOREIGN KEY → projects.id | Related project |
| timestamp | timestamp | NOT NULL | Transaction timestamp |
| proofHash | text | NOT NULL | SHA-256 proof hash |
| blockId | varchar | FOREIGN KEY → blocks.id | Block containing tx |
| type | text | NULLABLE | Mint, Buy, Sell, Verify, Rollback |
| buyerId | varchar | FOREIGN KEY → users.id | Buyer (for purchases) |
| contributorId | varchar | FOREIGN KEY → users.id | Contributor (for sales) |
| status | text | DEFAULT Completed | Transaction status |

### blocks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID |
| index | integer | NOT NULL | Block number |
| timestamp | timestamp | NOT NULL | Block creation time |
| merkleRoot | text | NOT NULL | Merkle tree root |
| previousHash | text | NOT NULL | Previous block hash |
| blockHash | text | NOT NULL, UNIQUE | Current block hash |
| blockHashInput | text | NOT NULL | Hash input data |
| validatorSignature | text | NULLABLE | Verifier signature |
| transactionCount | integer | NOT NULL | Number of transactions |

### credit_transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID |
| idempotencyKey | varchar | UNIQUE | Prevent duplicate purchases |
| buyerId | varchar | FOREIGN KEY → users.id | Purchasing user |
| contributorId | varchar | FOREIGN KEY → users.id | Selling user |
| projectId | varchar | FOREIGN KEY → projects.id | Project credits |
| credits | real | NOT NULL | Credit amount |
| amount | real | DEFAULT 0 | Purchase amount (USD) |
| timestamp | timestamp | NOT NULL | Transaction timestamp |
| certificateStatus | certificate_status | NOT NULL, DEFAULT valid | Certificate validity |

### reward_transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID |
| userId | varchar | FOREIGN KEY → users.id | User receiving points |
| points | real | NOT NULL | Blue Points amount |
| type | text | NOT NULL | EARNED or REVERSAL |
| role | text | NOT NULL | BUYER or CONTRIBUTOR |
| sourceTransactionId | varchar | FOREIGN KEY → credit_transactions.id | Source purchase |
| createdAt | timestamp | NOT NULL | Transaction timestamp |

### audit_logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID |
| userId | varchar | FOREIGN KEY → users.id | User performing action |
| actionType | text | NOT NULL | Action type constant |
| entityType | text | NOT NULL | Entity type |
| entityId | varchar | NULLABLE | Entity ID |
| metadata | text | NULLABLE | JSON metadata |
| timestamp | timestamp | NOT NULL | Action timestamp |

### system_settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID (default: 'global') |
| mintingEnabled | boolean | DEFAULT true | Whether minting is enabled |

### warnings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID |
| contributorId | varchar | FOREIGN KEY → users.id | Warned user |
| message | text | NOT NULL | Warning message |
| severity | text | NOT NULL | low, medium, critical |
| date | timestamp | DEFAULT now() | Warning date |

### rollbacks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | UUID |
| adminId | varchar | FOREIGN KEY → users.id | Admin performing rollback |
| targetId | varchar | NOT NULL | Target entity ID |
| type | text | NOT NULL | Rollback type |
| reason | text | NOT NULL | Rollback reason |
| timestamp | timestamp | DEFAULT now() | Rollback timestamp |

---

## Indexes

### projects
- `projects_user_id_idx` ON user_id
- `projects_status_idx` ON status
- `projects_verifier_id_idx` ON verifier_id

### transactions
- `transactions_project_id_idx` ON project_id
- `transactions_block_id_idx` ON block_id
- `transactions_to_idx` ON to
- `transactions_buyer_id_idx` ON buyer_id
- `transactions_contributor_id_idx` ON contributor_id

### credit_transactions
- `credit_tx_buyer_id_idx` ON buyer_id
- `credit_tx_contributor_id_idx` ON contributor_id
- `credit_tx_project_id_idx` ON project_id
- `credit_tx_idempotency_key_idx` UNIQUE ON idempotency_key

### reward_transactions
- `reward_tx_user_id_idx` ON user_id
- `reward_tx_source_tx_idx` ON source_transaction_id

### audit_logs
- `audit_logs_user_id_idx` ON user_id
- `audit_logs_action_type_idx` ON action_type
- `audit_logs_timestamp_idx` ON timestamp

### warnings
- `warnings_contributor_id_idx` ON contributor_id

### rollbacks
- `rollbacks_admin_id_idx` ON admin_id
- `rollbacks_target_id_idx` ON target_id

---

## Running Migrations

### Using Drizzle Kit

```bash
# Generate migration
npx drizzle-kit generate:migration

# Push schema to database
npx drizzle-kit push
```

### Manual Migration

Run SQL migration files in order:
```bash
psql $DATABASE_URL -f migrations/0001_reward_transactions.sql
psql $DATABASE_URL -f migrations/0002_admin_governance.sql
psql $DATABASE_URL -f migrations/0003_fix_foreign_keys.sql
```

---

## Database Management

### Backup

Use the admin backup endpoint:
```bash
curl -X POST http://localhost:5000/api/admin/backup \
  -H "Authorization: Bearer <admin-token>" \
  --output backup.json
```

### Cost Management (AWS RDS)

To reduce AWS billing:
1. Go to RDS Console → Databases → database-1
2. Actions → Stop (when not developing)
3. Actions → Start (when needed)
