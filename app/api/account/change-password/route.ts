import { NextRequest, NextResponse } from 'next/server';
import {
  authenticate,
  changePassword,
  getSessionFromToken,
  MIN_PASSWORD_LENGTH,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';
import apiError from '@/lib/apiError';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Guessing the current password from a stolen session should be slow too.
    const rateLimit = checkRateLimit(getRateLimitKey(req, `change-password:${user.username}`), 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
    }

    // A session alone isn't enough to change the password: prove you know the current one.
    if (!(await authenticate(user.username, currentPassword))) {
      await logAuditEvent('change_password.wrong_current', { username: user.username });
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const success = await changePassword(user.username, newPassword);
    if (!success) {
      return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }

    await logAuditEvent('change_password.completed', { username: user.username });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return apiError(err);
  }
}
