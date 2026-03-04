/**
 * Database Integrity Check Script
 * Run with: npx tsx check-db.ts
 */
import dotenv from 'dotenv';
dotenv.config();

// Also try loading from .env file manually
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}

import pkg from 'pg';
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL || '';
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

// Parse the DATABASE_URL to get connection parameters
// Format: postgresql://user:password@host:port/database
const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) {
  console.error('❌ Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

// Use standard pg Pool for RDS (not Neon serverless)
const pool = new Pool({
  user,
  password,
  host,
  port: parseInt(port),
  database,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
});

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

async function checkConnection() {
  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    results.push({
      name: 'Database Connection',
      status: 'PASS',
      message: 'Successfully connected to database',
      details: `Time: ${result.rows[0].current_time}, Version: ${result.rows[0].pg_version.substring(0, 50)}`
    });
    return true;
  } catch (err: any) {
    console.error('Connection error details:', err.message);
    results.push({
      name: 'Database Connection',
      status: 'FAIL',
      message: `Failed to connect: ${err.message}`
    });
    return false;
  }
}

async function checkTable(tableName: string): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists
    `, [tableName]);
    
    if (result.rows[0].exists) {
      // Get row count
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      results.push({
        name: `Table: ${tableName}`,
        status: 'PASS',
        message: 'Table exists',
        details: `Row count: ${countResult.rows[0].count}`
      });
      return true;
    } else {
      results.push({
        name: `Table: ${tableName}`,
        status: 'FAIL',
        message: 'Table does not exist'
      });
      return false;
    }
  } catch (err: any) {
    results.push({
      name: `Table: ${tableName}`,
      status: 'FAIL',
      message: `Error: ${err.message}`
    });
    return false;
  }
}

async function checkRelationship(
  tableName: string, 
  columnName: string, 
  refTable: string, 
  refColumn: string = 'id'
) {
  try {
    // Check if the foreign key exists
    const result = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
        AND kcu.column_name = $2
        AND ccu.table_name = $3
    `, [tableName, columnName, refTable]);

    if (result.rows.length > 0) {
      results.push({
        name: `Relationship: ${tableName}.${columnName} → ${refTable}.${refColumn}`,
        status: 'PASS',
        message: 'Foreign key relationship exists'
      });
      return true;
    } else {
      results.push({
        name: `Relationship: ${tableName}.${columnName} → ${refTable}.${refColumn}`,
        status: 'WARN',
        message: 'Foreign key constraint not found (may use application-level integrity)'
      });
      return false;
    }
  } catch (err: any) {
    results.push({
      name: `Relationship: ${tableName}.${columnName} → ${refTable}.${refColumn}`,
      status: 'FAIL',
      message: `Error: ${err.message}`
    });
    return false;
  }
}

async function checkOrphanRecords(
  tableName: string,
  columnName: string,
  refTable: string,
  refColumn: string = 'id'
) {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as orphan_count
      FROM "${tableName}" t
      LEFT JOIN "${refTable}" r ON t.${columnName} = r.${refColumn}
      WHERE t.${columnName} IS NOT NULL AND r.${refColumn} IS NULL
    `);
    
    const orphanCount = parseInt(result.rows[0].orphan_count);
    if (orphanCount > 0) {
      results.push({
        name: `Orphan Check: ${tableName}.${columnName}`,
        status: 'WARN',
        message: `Found ${orphanCount} orphan records`,
        details: `References non-existent ${refTable}.${refColumn}`
      });
      return false;
    } else {
      results.push({
        name: `Orphan Check: ${tableName}.${columnName}`,
        status: 'PASS',
        message: 'No orphan records found'
      });
      return true;
    }
  } catch (err: any) {
    results.push({
      name: `Orphan Check: ${tableName}.${columnName}`,
      status: 'FAIL',
      message: `Error: ${err.message}`
    });
    return false;
  }
}

async function checkNullIds(tableName: string, columnName: string = 'id') {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as null_count
      FROM "${tableName}"
      WHERE "${columnName}" IS NULL
    `);
    
    const nullCount = parseInt(result.rows[0].null_count);
    if (nullCount > 0) {
      results.push({
        name: `Null Check: ${tableName}.${columnName}`,
        status: 'FAIL',
        message: `Found ${nullCount} NULL values in ${columnName}`
      });
      return false;
    } else {
      results.push({
        name: `Null Check: ${tableName}.${columnName}`,
        status: 'PASS',
        message: 'No NULL values found'
      });
      return true;
    }
  } catch (err: any) {
    results.push({
      name: `Null Check: ${tableName}.${columnName}`,
      status: 'FAIL',
      message: `Error: ${err.message}`
    });
    return false;
  }
}

async function runChecks() {
  const maskedUrl = DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  
  console.log('🔍 Starting Database Integrity Check...\n');
  console.log(`📡 Database: ${host}:${port}/${database}`);
  console.log('');

  // 1. Check connection
  const connected = await checkConnection();
  if (!connected) {
    console.log('\n❌ Database connection failed. Exiting.');
    await pool.end();
    process.exit(1);
  }

  // 2. Check required tables
  console.log('\n📋 Checking tables...');
  const requiredTables = [
    'users',
    'projects', 
    'transactions',
    'system_settings',
    'warnings',
    'rollbacks',
    'blocks',
    'credit_transactions',
    'reward_transactions',
    'audit_logs'
  ];

  for (const table of requiredTables) {
    await checkTable(table);
  }

  // 3. Check relationships
  console.log('\n🔗 Checking relationships...');
  
  // projects.userId → users.id
  await checkRelationship('projects', 'user_id', 'users', 'id');
  
  // projects.verifierId → users.id
  await checkRelationship('projects', 'verifier_id', 'users', 'id');
  
  // transactions.projectId → projects.id
  await checkRelationship('transactions', 'project_id', 'projects', 'id');
  
  // transactions.buyerId → users.id
  await checkRelationship('transactions', 'buyer_id', 'users', 'id');
  
  // warnings.contributorId → users.id
  await checkRelationship('warnings', 'contributor_id', 'users', 'id');
  
  // rollbacks.adminId → users.id
  await checkRelationship('rollbacks', 'admin_id', 'users', 'id');
  
  // Additional important relationships
  await checkRelationship('credit_transactions', 'buyer_id', 'users', 'id');
  await checkRelationship('credit_transactions', 'contributor_id', 'users', 'id');
  await checkRelationship('credit_transactions', 'project_id', 'projects', 'id');
  await checkRelationship('reward_transactions', 'user_id', 'users', 'id');

  // 4. Check for orphan records (only if tables have data)
  console.log('\n🛡️ Checking for orphan records...');
  
  // Check projects with invalid userId
  await checkOrphanRecords('projects', 'user_id', 'users', 'id');
  
  // Check projects with invalid verifierId (nullable, so only check if not null)
  const projectsWithVerifiers = await pool.query(`
    SELECT COUNT(*) as count FROM projects WHERE verifier_id IS NOT NULL
  `);
  if (parseInt(projectsWithVerifiers.rows[0].count) > 0) {
    await checkOrphanRecords('projects', 'verifier_id', 'users', 'id');
  }
  
  // Check transactions with invalid projectId
  await checkOrphanRecords('transactions', 'project_id', 'projects', 'id');
  
  // Check warnings with invalid contributorId
  await checkOrphanRecords('warnings', 'contributor_id', 'users', 'id');
  
  // Check rollbacks with invalid adminId
  await checkOrphanRecords('rollbacks', 'admin_id', 'users', 'id');
  
  // Check credit_transactions
  await checkOrphanRecords('credit_transactions', 'buyer_id', 'users', 'id');
  await checkOrphanRecords('credit_transactions', 'contributor_id', 'users', 'id');
  await checkOrphanRecords('credit_transactions', 'project_id', 'projects', 'id');

  // 5. Check NOT NULL columns
  console.log('\n🔢 Checking required fields for NULL values...');
  
  const requiredNonNullColumns = [
    { table: 'users', column: 'id' },
    { table: 'users', column: 'email' },
    { table: 'users', column: 'password' },
    { table: 'projects', column: 'id' },
    { table: 'projects', column: 'user_id' },
    { table: 'transactions', column: 'id' },
    { table: 'transactions', column: 'project_id' },
  ];

  for (const { table, column } of requiredNonNullColumns) {
    await checkNullIds(table, column);
  }

  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('📊 DATABASE INTEGRITY CHECK RESULTS');
  console.log('='.repeat(70));

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  for (const result of results) {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
    console.log(`\n${icon} ${result.name}: ${result.status}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
    
    if (result.status === 'PASS') passCount++;
    else if (result.status === 'FAIL') failCount++;
    else warnCount++;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📈 SUMMARY: ${passCount} Passed, ${warnCount} Warnings, ${failCount} Failed`);
  console.log('='.repeat(70));

  // Final status
  const overallStatus = failCount > 0 ? 'ISSUES FOUND' : (warnCount > 0 ? 'WARNINGS ONLY' : 'HEALTHY');
  console.log(`\n🏥 DATABASE STATUS: ${overallStatus}`);

  await pool.end();
  
  if (failCount > 0) {
    process.exit(1);
  }
}

runChecks().catch(async (err) => {
  console.error('❌ Unexpected error:', err);
  await pool.end();
  process.exit(1);
});
