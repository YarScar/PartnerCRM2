import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { changePassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
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

    // mark token used
    await (prisma as any).passwordResetToken.update({ where: { token }, data: { used: true } });

    if (!changed) return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('reset-password error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
