import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createPasswordResetToken } from '@/lib/auth';
import { sendPasswordResetEmail, sendUsernameEmail } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {

    const { identifier } = await req.json();
    if (!identifier) return NextResponse.json({ error: 'identifier required' }, { status: 400 });

    const trimmed = identifier.trim();

    // Check whether the `email` column exists in the DB. If it does, allow
    // lookups by email; otherwise only look up by username to avoid runtime
    // Prisma errors when the DB schema lags behind the code.
    let account = null;
    const emailColumnRows: any = await prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='email';`
    );
    const emailColumnExists = Array.isArray(emailColumnRows) && emailColumnRows.length > 0;

    if (trimmed.includes('@') && emailColumnExists) {
      account = await prisma.user.findFirst({ where: { email: trimmed } as any });
    } else {
      account = await prisma.user.findUnique({ where: { username: trimmed } });
    }

    if (!account) return NextResponse.json({ ok: true }); // don't reveal existence

    const token = await createPasswordResetToken(account.username);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/login/reset?token=${encodeURIComponent(token)}`;

    // If user has an email, send username and reset link to that email
    if (account.email) {
      const ures = await sendUsernameEmail(account.username, account.email).catch((err) => ({ sent: false, error: String(err) }));
      console.log('[forgot-password] sendUsernameEmail result:', ures);
      const rres = await sendPasswordResetEmail(account.username, token, account.email).catch((err) => ({ sent: false, error: String(err) }));
      console.log('[forgot-password] sendPasswordResetEmail result:', rres);

      // If sending failed, log the reset URL so testing can proceed without provider keys.
      if (!rres.sent) {
        console.log('[forgot-password] password reset token (dev):', token);
        console.log('[forgot-password] password reset URL (dev):', resetUrl);
      }
    } else {
      // fallback: send reset to admin/notification recipient
      const rres = await sendPasswordResetEmail(account.username, token).catch((err) => ({ sent: false, error: String(err) }));
      console.log('[forgot-password] sendPasswordResetEmail result (admin):', rres);

      if (!rres.sent) {
        console.log('[forgot-password] password reset token (dev):', token);
        console.log('[forgot-password] password reset URL (dev):', resetUrl);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
