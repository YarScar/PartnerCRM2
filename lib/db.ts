import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// false = use the in-memory mock store (lib/mock-data.ts), which is for local
// prototyping only. In production a missing DATABASE_URL is a misconfiguration:
// fail loudly rather than accept intake forms into memory and lose them.
export function hasDb(): boolean {
  if (process.env.DATABASE_URL) return true;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is not set');
  }
  return false;
}

// Cache for column existence checks to avoid repeated queries during a request-heavy period.
const columnExistenceCache = new Map<string, boolean>();

export async function hasColumn(table: string, column: string): Promise<boolean> {
  const key = `${table}.${column}`;
  if (columnExistenceCache.has(key)) return columnExistenceCache.get(key)!;

  try {
    // Query information_schema for Postgres.
    const rows: any = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = ${table} AND column_name = ${column} LIMIT 1
    `;
    const exists = Array.isArray(rows) ? rows.length > 0 : Boolean(rows);
    columnExistenceCache.set(key, exists);
    return exists;
  } catch (err) {
    console.warn('hasColumn check failed', err);
    return false;
  }
}

export function clearColumnCache(table: string, column?: string) {
  if (column) {
    columnExistenceCache.delete(`${table}.${column}`);
  } else {
    // Clear any entries for the given table.
    for (const k of Array.from(columnExistenceCache.keys())) {
      if (k.startsWith(`${table}.`)) columnExistenceCache.delete(k);
    }
  }
}
