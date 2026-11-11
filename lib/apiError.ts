import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

/**
 * True when the database can't be reached or refused the login: a wrong or reset
 * password, a deleted or suspended Neon branch, a paused compute. These are outages,
 * not bugs in the request, so they get their own status and message.
 */
export function isDatabaseUnavailable(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  // P1000 login failed, P1001 can't reach, P1002 timed out, P1017 server closed the connection.
  return err instanceof Prisma.PrismaClientKnownRequestError && ['P1000', 'P1001', 'P1002', 'P1017'].includes(err.code);
}

export function apiError(err: any, status = 500) {
  try {
    console.error('API error:', err && err.stack ? err.stack : err);
  } catch (e) {
    // ignore
  }
  if (isDatabaseUnavailable(err)) {
    return NextResponse.json(
      { error: 'The database is unavailable right now. Please try again in a few minutes.' },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: 'Internal server error' }, { status });
}

export default apiError;
