import { NextRequest, NextResponse } from 'next/server';
import { getPartner, updatePartner, deletePartner } from '@/lib/partners';
import apiError from '@/lib/apiError';
import { parseId } from '@/lib/parseId';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';

async function requireSession(req: NextRequest) {
  return getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession(_req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const partner = await getPartner(id);
    if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ partner });
  } catch (err: any) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = await req.json();
    const partner = await updatePartner(id, data);
    if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ partner });
  } catch (err: any) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const deleted = await deletePartner(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return apiError(err);
  }
}
