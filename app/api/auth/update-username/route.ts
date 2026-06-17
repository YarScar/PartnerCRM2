import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, SESSION_COOKIE_NAME, createSessionToken } from '@/lib/auth';
import { prisma } from '@/lib/db';

function validUsername(u: string) {
  return typeof u === 'string' && u.trim().length >= 3 && !/\s/.test(u);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { newUsername } = await req.json();
    if (!validUsername(newUsername)) return NextResponse.json({ error: 'Invalid username' }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { username: newUsername } });
    if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });

    // Update username
    const updated = await prisma.user.update({ where: { username: user.username }, data: { username: newUsername } });

    // Re-issue session cookie
    const payload = { username: updated.username, email: updated.email ?? null, displayName: updated.display_name, role: updated.role };
    const token = await createSessionToken(payload as any);

    const response = NextResponse.json({ ok: true });
    response.cookies.set({ name: SESSION_COOKIE_NAME, value: token, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (err: any) {
    console.error('update-username error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
