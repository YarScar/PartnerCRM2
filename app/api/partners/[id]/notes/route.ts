import { NextRequest, NextResponse } from 'next/server';
import { addNote } from '@/lib/partners';
import apiError from '@/lib/apiError';
import { parseId } from '@/lib/parseId';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

const MAX_NOTE_CHARS = 10_000;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { body } = await req.json();
    if (typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'Note body required' }, { status: 400 });
    }
    if (body.length > MAX_NOTE_CHARS) {
      return NextResponse.json({ error: `Notes must be ${MAX_NOTE_CHARS} characters or fewer` }, { status: 400 });
    }
    // The author is always the signed-in user, never a name sent by the browser.
    const note = await addNote(id, body, user.displayName);
    return NextResponse.json({ note }, { status: 201 });
  } catch (err: any) {
    return apiError(err);
  }
}
