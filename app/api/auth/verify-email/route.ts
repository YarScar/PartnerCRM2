import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.redirect(new URL('/settings?verified=error', req.url));

    const ev = await prisma.emailVerificationToken.findFirst({ where: { token, used: false, expiresAt: { gt: new Date() } } });
    if (!ev) return NextResponse.redirect(new URL('/settings?verified=error', req.url));

    // update user and mark token used
    await prisma.user.update({ where: { id: ev.userId }, data: { email: ev.email, email_verified: true, pending_email: null } });
    await prisma.emailVerificationToken.update({ where: { id: ev.id }, data: { used: true } });

    return NextResponse.redirect(new URL('/settings?verified=success', req.url));
  } catch (err) {
    console.error('verify-email error', err);
    return NextResponse.redirect(new URL('/settings?verified=error', req.url));
  }
}
