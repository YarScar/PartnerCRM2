import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { hashResetToken } from '@/lib/resetToken';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    // Keep this endpoint from being spammed.
    const rateLimitKey = getRateLimitKey(req, 'forgot-password');
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      await logAuditEvent('forgot_password.rate_limited', { key: rateLimitKey });
      return NextResponse.json({ ok: true }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.retryAfterMs || 0) / 1000)) } });
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string') return NextResponse.json({ ok: true });

    const normalized = String(email).trim();

    // Match the verified email (users.email is only set once the link in the
    // verification email is clicked), or a username that is itself an email.
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalized, mode: 'insensitive' }, email_verified: true },
          { username: { equals: normalized, mode: 'insensitive' } },
        ],
      },
    });
    // Only ever send to an address we know belongs to the account, never to what was typed.
    const sendTo = user?.email && user.email_verified ? user.email : user?.username.includes('@') ? user.username : null;

    if (user && sendTo) {
      // Track that a reset was requested without exposing the token itself.
      await logAuditEvent('forgot_password.requested', { username: user.username });
      try {
        // The link carries the token; only its hash is stored, so a database leak
        // can't be turned into working reset links. Single use, one hour.
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.passwordResetToken.create({
          data: {
            token: hashResetToken(token),
            userId: user.id,
            expiresAt,
          },
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        try {
          // The email just carries the reset link, nothing else.
          await sendPasswordResetEmail(sendTo, resetUrl);
        } catch (err) {
          console.error('sendPasswordResetEmail failed', { username: user.username }, err);
          // Do not surface provider errors to the client; still return OK for security
        }
      } catch (err) {
        console.error('forgot-password inner error', err);
      }
    } else if (user) {
      await logAuditEvent('forgot_password.no_email_on_file', { username: user.username });
    }

    // Same answer whether or not the account exists, so this can't be used to find accounts.
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('forgot-password error', err);
    return NextResponse.json({ ok: true });
  }
}
