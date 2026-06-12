import { NextRequest, NextResponse } from 'next/server';
import { getUsernameFromPasswordResetToken, changePassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) return NextResponse.json({ error: 'token and newPassword required' }, { status: 400 });

    if (newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    const username = await getUsernameFromPasswordResetToken(token);
    if (!username) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });

    const success = await changePassword(username, newPassword);
    if (!success) return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
