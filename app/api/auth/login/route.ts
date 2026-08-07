import { NextRequest, NextResponse } from 'next/server';
import { authenticate, createSessionToken } from '@/lib/auth';
import apiError from '@/lib/apiError';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(req, 'login');
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      await logAuditEvent('login.rate_limited', { key: rateLimitKey });
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.retryAfterMs || 0) / 1000)) } });
    }

    const { username, password } = await req.json();
    const user = await authenticate(String(username || ''), String(password || ''));

    if (!user) {
      await logAuditEvent('login.failed', { username: String(username || '') });
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    await logAuditEvent('login.success', { username: user.username });

    const response = NextResponse.json({ user });
    response.headers.set('Cache-Control', 'no-store');
    response.cookies.set({
      name: 'createaccess_session',
      value: await createSessionToken(user),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err: any) {
    return apiError(err);
  }
}
