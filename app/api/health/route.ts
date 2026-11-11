import { NextResponse } from 'next/server';
import { hasDb, prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DB_TIMEOUT_MS = 8000;

/**
 * Liveness plus a real database check, so an outage (unreachable Neon branch, wrong
 * password) shows up here and in the hourly health workflow instead of only as failed
 * logins. Returns 503 when the database is down; never includes error details.
 */
export async function GET() {
  const hasResendKey = Boolean(process.env.RESEND_API_KEY);
  const hasEmailFrom = Boolean(process.env.EMAIL_FROM);

  let database: 'ok' | 'unreachable' | 'not_configured';
  try {
    if (!hasDb()) {
      database = 'not_configured';
    } else {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('database check timed out')), DB_TIMEOUT_MS)),
      ]);
      database = 'ok';
    }
  } catch (err) {
    console.error('Health check: database unavailable:', err instanceof Error ? err.message.split('\n').filter(Boolean).pop() : err);
    database = 'unreachable';
  }

  const ok = database !== 'unreachable';
  return NextResponse.json(
    { ok, database, hasResendKey, hasEmailFrom },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
