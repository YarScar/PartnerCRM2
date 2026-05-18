import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, changePassword, SESSION_COOKIE_NAME, authenticate, createSessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Verify current password before allowing change
    const verified = await authenticate(user.username, currentPassword);
    if (!verified) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const success = await changePassword(user.username, newPassword);
    if (!success) {
      return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }

    // Refresh session token so any client-side session payloads reflect current state
    const newToken = await createSessionToken({ username: user.username, displayName: user.displayName, role: (user as any).role });
    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', `${SESSION_COOKIE_NAME}=${newToken}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 7}`);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
