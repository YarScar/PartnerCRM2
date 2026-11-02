import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';
import { isCronRequest } from '@/lib/cron';
import { sendWeeklyDigest } from '@/lib/notifications';

// One email per admin, sent one after another.
export const maxDuration = 60;

async function send() {
  try {
    const result = await sendWeeklyDigest();
    if (result.skipped) {
      return NextResponse.json(
        { error: 'No admin email addresses: verify an admin email in Settings or set NOTIFICATION_EMAILS' },
        { status: 400 }
      );
    }
    if (result.sent.length === 0) {
      return NextResponse.json({ error: 'Digest could not be sent to anyone', failed: result.failed }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sentTo: result.sent, failed: result.failed });
  } catch (err: any) {
    console.error('digest send error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// Scheduled weekly send (Vercel Cron, see vercel.json).
export async function GET(req: NextRequest) {
  if (!isCronRequest(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return send();
}

// "Email Admins" button on /admin/digest.
export async function POST(req: NextRequest) {
  const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return send();
}
