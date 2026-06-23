import { NextResponse } from 'next/server';

export function apiError(err: any, status = 500) {
  try {
    console.error('API error:', err && err.stack ? err.stack : err);
  } catch (e) {
    // ignore
  }
  return NextResponse.json({ error: 'Internal server error' }, { status });
}

export default apiError;
