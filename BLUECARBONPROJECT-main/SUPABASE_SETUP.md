# Supabase Integration Guide

This guide explains how to migrate your BlueCarbon Ledger application from in-memory storage to Supabase PostgreSQL database.

## Overview

The application is designed for easy database switching:
- **Current Mode**: In-memory storage (MemStorage) - data resets on server restart
- **Database Mode**: PostgreSQL storage (DbStorage) - persistent data in Supabase or any PostgreSQL database

## Quick Start

### Option 1: Use Replit's Built-in PostgreSQL Database

The database is already provisioned! To use it:

1. **Set Environment Variable**
   ```bash
   # Add to your .env file or Replit Secrets
   USE_DATABASE=true
   ```

2. **Push Schema to Database**
   ```bash
   npm run db:push
   ```

3. **Seed Demo Data** (Optional)
   ```bash
   tsx server/seed.ts
   ```

4. **Restart the Application**
   The server will now use PostgreSQL storage instead of in-memory storage.

### Option 2: Use Supabase (External)

#### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the project to be ready (takes ~2 minutes)
4. Go to **Settings** → **Database**
5. Copy your **Connection String** (Transaction mode recommended)

#### Step 2: Configure Environment Variables

Add these to your environment (Replit Secrets or .env file):

```bash
# Enable database mode
USE_DATABASE=true

# Supabase connection string
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-ID]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# These are automatically set by Supabase connection string
# You don't need to set them separately
```

**Important**: Replace `[YOUR-PROJECT-ID]`, `[YOUR-PASSWORD]`, and `[REGION]` with your actual Supabase credentials.

#### Step 3: Push Database Schema

Run the migration command to create all tables:

```bash
npm run db:push
```

This will create the following tables:
- `users` - User accounts with roles (admin, verifier, user)
- `projects` - Blue carbon projects with status tracking
- `transactions` - Blockchain transactions
- `blocks` - Blockchain blocks with Merkle trees

#### Step 4: Seed Demo Data (Optional)

To populate the database with demo accounts:

```bash
tsx server/seed.ts
```

This creates:
- **Admin**: admin@bluecarbon.com / admin123
- **Verifier**: verifier1@bluecarbon.com / verifier123
- **Users**: alice@bluecarbon.com / password123, bob@bluecarbon.com / password123

#### Step 5: Restart Your Application

Restart the server. You should see:
```
✅ Using PostgreSQL database storage
```

## Switching Back to In-Memory Storage

To switch back to in-memory storage:

1. Remove or set `USE_DATABASE=false`
2. Restart the server
3. You'll see: `✅ Using in-memory storage`

## Database Schema

The application uses Drizzle ORM with the following schema:

### Users Table
```typescript
{
  id: varchar (UUID primary key)
  name: text
  email: text (unique)
  password: text (bcrypt hashed)
  role: text ('admin' | 'verifier' | 'user')
  username: text (optional, for legacy demo accounts)
}
```

### Projects Table
```typescript
{
  id: varchar (UUID primary key)
  name: text
  description: text
  location: text
  area: real (hectares)
  ecosystemType: text ('Mangrove' | 'Seagrass' | 'Salt Marsh' | 'Coastal' | 'Other')
  annualCO2: real (tons/year)
  lifetimeCO2: real (tons over 20 years)
  co2Captured: real (legacy field)
  status: text ('pending' | 'verified' | 'rejected')
  userId: varchar (foreign key to users)
  proofFileUrl: text (optional)
  verifierId: varchar (optional)
  rejectionReason: text (optional)
  submittedAt: timestamp
}
```

### Transactions Table
```typescript
{
  id: varchar (UUID primary key)
  txId: text (unique blockchain transaction ID)
  from: text (sender address)
  to: text (recipient address)
  credits: real (carbon credits)
  projectId: varchar (foreign key to projects)
  timestamp: timestamp
  proofHash: text (SHA-256 hash)
  blockId: varchar (optional, assigned when added to block)
}
```

### Blocks Table
```typescript
{
  id: varchar (UUID primary key)
  index: integer (block number)
  timestamp: timestamp
  merkleRoot: text (Merkle tree root hash)
  previousHash: text (previous block hash)
  blockHash: text (unique, SHA-256 hash of block)
  blockHashInput: text (pre-hash data for verification)
  validatorSignature: text (optional)
  transactionCount: integer
}
```

## Verifying the Database Connection

### Check Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on **Table Editor**
3. You should see the tables: `users`, `projects`, `transactions`, `blocks`
4. Click on any table to view its data

### Check Application Logs

When the server starts with database mode:
```
✅ Using PostgreSQL database storage
[express] serving on port 5000
```

If the database connection fails:
```
❌ Database connection failed, falling back to in-memory storage
```

## Troubleshooting

### Connection Error

**Problem**: `DATABASE_URL must be set. Did you forget to provision a database?`

**Solution**: Ensure `DATABASE_URL` is set in your environment variables.

### Schema Push Fails

**Problem**: `npm run db:push` fails

**Solution**: 
```bash
npm run db:push --force
```

### Data Not Persisting

**Problem**: Data disappears after restart

**Solution**: 
1. Check that `USE_DATABASE=true` is set
2. Verify the server logs show "Using PostgreSQL database storage"
3. Ensure the database connection string is correct

### Seed Script Error

**Problem**: Seed script fails with duplicate key error

**Solution**: The demo users already exist. This is normal and expected.

## Data Migration (In-Memory to Database)

Currently, there's no automatic migration from in-memory to database. When you switch to database mode:

1. The database starts empty
2. Run the seed script to add demo users
3. Regular users can sign up with their Gmail accounts
4. All data from in-memory storage is lost when switching

**Best Practice**: Decide early whether to use in-memory or database storage.

## Supabase-Specific Features

### Row Level Security (RLS)

Supabase supports Row Level Security. To enable:

1. Go to **Authentication** → **Policies** in Supabase dashboard
2. Create policies for your tables
3. Update the application to use Supabase Auth (future enhancement)

### Real-time Subscriptions

Supabase supports real-time updates. To enable:

```typescript
// Example: Listen to new projects
const { data, error } = await supabase
  .from('projects')
  .on('INSERT', payload => {
    console.log('New project:', payload.new)
  })
  .subscribe()
```

### Database Backups

Supabase automatically backs up your database:
- Go to **Settings** → **Database**
- Click **Database Backups**
- Download backups or restore to a point in time

## Environment Variables Reference

```bash
# Required for database mode
USE_DATABASE=true                    # Enable PostgreSQL storage
DATABASE_URL=postgresql://...        # Supabase connection string

# Auto-configured from DATABASE_URL (no need to set manually)
PGHOST=aws-0-[region].pooler.supabase.com
PGPORT=6543
PGDATABASE=postgres
PGUSER=postgres.[project-id]
PGPASSWORD=[your-password]
```

## Next Steps

After successfully connecting to Supabase:

1. ✅ Test user signup with Gmail addresses
2. ✅ Create a carbon project
3. ✅ Assign verifier and approve project
4. ✅ Verify blockchain transaction is created
5. ✅ Check data persists across server restarts

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

For BlueCarbon Ledger issues:
- Check the main README.md
- Review replit.md for architecture details
