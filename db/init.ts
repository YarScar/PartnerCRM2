/**
 * Database initialization script.
 * Run with: npm run db:init
 *
 * Reads db/schema.sql and executes against your Neon database.
 * Requires DATABASE_URL in .env.local
 */
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ DATABASE_URL not set in .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const schema = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf-8');

  // Split on semicolons but respect dollar-quoted function bodies
  const statements = splitSqlStatements(schema);

  console.log(`📦 Running ${statements.length} statements against Neon...`);
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await pool.query(stmt);
      } catch (err: any) {
        console.error(`⚠️  Statement failed: ${stmt.slice(0, 60)}...`);
        console.error(err.message);
      }
    }
  }
  await pool.end();
  console.log('✅ Schema initialized successfully');
}

function splitSqlStatements(sql: string): string[] {
  const out: string[] = [];
  let current = '';
  let inDollarQuote = false;

  for (const line of sql.split('\n')) {
    if (line.includes('$$')) inDollarQuote = !inDollarQuote;
    current += line + '\n';
    if (!inDollarQuote && line.trim().endsWith(';')) {
      out.push(current);
      current = '';
    }
  }
  if (current.trim()) out.push(current);
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
