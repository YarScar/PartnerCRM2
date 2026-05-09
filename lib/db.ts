import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

/**
 * Get a Neon SQL client. Returns null if DATABASE_URL is not configured —
 * callers should fall back to mock data in that case.
 */
export function getDb(): NeonQueryFunction<false, false> | null {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  _sql = neon(url);
  return _sql;
}

export function hasDb(): boolean {
  return !!process.env.DATABASE_URL;
}
