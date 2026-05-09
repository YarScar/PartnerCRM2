import { NextRequest, NextResponse } from 'next/server';
import { addNote } from '@/lib/partners';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { body, author } = await req.json();
    if (!body?.trim()) {
      return NextResponse.json({ error: 'Note body required' }, { status: 400 });
    }
    const note = await addNote(parseInt(id), body, author || user.displayName);
    return NextResponse.json({ note }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
