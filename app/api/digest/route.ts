import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';
import { generateDigestMarkdown, getDigestData } from '@/lib/digest';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = await getSessionFromToken(cookie);
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await getDigestData();
    const markdown = await generateDigestMarkdown(data);

    return NextResponse.json({ markdown, generatedAt: new Date().toISOString(), data });
  } catch (err: any) {
    console.error('digest GET error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
