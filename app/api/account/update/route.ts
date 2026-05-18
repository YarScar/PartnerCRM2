import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, SESSION_COOKIE_NAME, createSessionToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { displayName } = await req.json();
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid display name' }, { status: 400 });
    }

    await prisma.user.update({ where: { username: user.username }, data: { display_name: displayName.trim() } });

    // issue a refreshed session token with the new display name
    const newToken = await createSessionToken({ username: user.username, displayName: displayName.trim(), role: (user as any).role });
    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', `${SESSION_COOKIE_NAME}=${newToken}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 7}`);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
