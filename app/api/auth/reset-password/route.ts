import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { changePassword } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    // This is another high-value route, so it gets the same simple rate limit.
    const rateLimitKey = getRateLimitKey(req, 'reset-password');
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      await logAuditEvent('reset_password.rate_limited', { key: rateLimitKey });
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.retryAfterMs || 0) / 1000)) } });
    }

    const { token, password } = await req.json();
    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const record = await (prisma as any).passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used) {
      return NextResponse.json({ ok: true });
    }

    if (record.expiresAt < new Date()) {
      // mark used to prevent reuse
      await (prisma as any).passwordResetToken.update({ where: { token }, data: { used: true } });
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const changed = await changePassword(user.username, password);
    // Once the password is changed, the token should never be usable again.
    await logAuditEvent('reset_password.completed', { username: user.username });

    // mark token used
    await (prisma as any).passwordResetToken.update({ where: { token }, data: { used: true } });

    if (!changed) return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('reset-password error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
