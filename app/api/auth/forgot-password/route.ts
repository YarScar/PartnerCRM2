import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') return NextResponse.json({ ok: true });

    const normalized = String(email).trim();

    // The project stores user identifiers in `username`. Use case-insensitive match.
    const user = await prisma.user.findFirst({ where: { username: { equals: normalized, mode: 'insensitive' } } });

    if (user) {
      try {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await (prisma as any).passwordResetToken.create({
          data: {
            token,
            userId: user.id,
            expiresAt,
          },
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        try {
          await sendPasswordResetEmail(normalized, resetUrl);
        } catch (err) {
          console.error('sendPasswordResetEmail failed for', normalized, err);
          // Do not surface provider errors to the client; still return OK for security
        }
      } catch (err) {
        console.error('forgot-password inner error', err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('forgot-password error', err);
    return NextResponse.json({ ok: true });
  }
}
