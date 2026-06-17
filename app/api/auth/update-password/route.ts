import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, SESSION_COOKIE_NAME, changePassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });


    // Verify current password using authenticate helper
    const { authenticate } = await import('@/lib/auth');
    const identifier = user.email && user.email.length ? user.email : user.username;
    const auth = await authenticate(identifier, currentPassword);
    if (!auth) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const success = await changePassword(identifier, newPassword);
    if (!success) return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('update-password error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
