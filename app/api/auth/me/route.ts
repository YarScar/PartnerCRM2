import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
