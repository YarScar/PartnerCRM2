import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { changePassword, MIN_PASSWORD_LENGTH } from '@/lib/auth';
import { hashResetToken } from '@/lib/resetToken';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { logAuditEvent } from '@/lib/audit';

const INVALID_LINK = 'This reset link is invalid or has expired. Request a new one.';

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
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
    }

    const tokenHash = hashResetToken(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });
    if (!record || record.used || record.expiresAt < new Date()) {
      return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
    }

    const changed = await changePassword(user.username, password);
    if (!changed) return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });

    // Once the password is changed, no reset link for this account should work again.
    await prisma.passwordResetToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
    await logAuditEvent('reset_password.completed', { username: user.username });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('reset-password error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
