import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma, hasColumn, clearColumnCache } from '@/lib/db';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sendEmailVerification } from '@/lib/email';

function validEmail(e: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !validEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const normalized = String(email).trim().toLowerCase();

    const hasEmail = await hasColumn('users', 'email');
    const hasPending = await hasColumn('users', 'pending_email');
    const hasTokenTable = await hasColumn('email_verification_tokens', 'id');

    if (!hasEmail || !hasPending || !hasTokenTable) {
      console.error('request-verification: missing expected DB columns or tables', {
        hasEmail,
        hasPending,
        hasTokenTable,
      });
      return NextResponse.json({ error: 'Database schema not updated. Run migration locally.' }, { status: 500 });
    }

    // Find DB user from session (prefer email in session)
    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findUnique({ where: { email: (user as any).email ?? undefined, username: user.username } as any });
    } catch (err: any) {
      console.error('request-verification: DB lookup failed, invalidating email column cache', err?.message ?? err);
      clearColumnCache('users', 'email');
      try {
        dbUser = await prisma.user.findUnique({ where: { username: user.username } });
      } catch (err2: any) {
        console.error('request-verification: fallback username lookup failed', err2?.message ?? err2);
      }
    }

    if (!dbUser) return NextResponse.json({ error: 'User not found in DB' }, { status: 500 });

    // Ensure no other user already has this email
    const existing = await prisma.user.findFirst({ where: { email: normalized } as any });
    if (existing && existing.id !== dbUser.id) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await (prisma as any).emailVerificationToken.create({
      data: {
        token,
        userId: dbUser.id,
        email: normalized,
        expiresAt,
      },
    });

    await prisma.user.update({ where: { id: dbUser.id }, data: { pending_email: normalized } as any });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
    sendEmailVerification(normalized, verifyUrl).catch((err) => console.error('sendEmailVerification error', err));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('request-verification error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
