import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, changePassword, SESSION_COOKIE_NAME } from '@/lib/auth';
import apiError from '@/lib/apiError';

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

    const success = await changePassword(user.username, newPassword);
    if (!success) {
      return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return apiError(err);
  }
}
