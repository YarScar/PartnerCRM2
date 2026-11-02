import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/db';
import apiError from '@/lib/apiError';

const MAX_DISPLAY_NAME = 80;

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { displayName } = await req.json();
    const name = typeof displayName === 'string' ? displayName.trim().replace(/\s+/g, ' ') : '';
    if (!name) return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    if (name.length > MAX_DISPLAY_NAME) {
      return NextResponse.json({ error: `Display name must be ${MAX_DISPLAY_NAME} characters or fewer` }, { status: 400 });
    }

    await prisma.user.update({ where: { username: user.username }, data: { display_name: name } });

    // The name in the top bar comes from the login cookie, so re-issue it with the new name.
    const response = NextResponse.json({ ok: true, displayName: name });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: await createSessionToken({ ...user, displayName: name }),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err: any) {
    return apiError(err);
  }
}
