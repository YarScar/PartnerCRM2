import { NextRequest, NextResponse } from 'next/server';
import { authenticate, createSessionToken } from '@/lib/auth';
import apiError from '@/lib/apiError';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const user = await authenticate(String(username || ''), String(password || ''));

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const response = NextResponse.json({ user });
    response.cookies.set({
      name: 'createaccess_session',
      value: await createSessionToken(user),
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
