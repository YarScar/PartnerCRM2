import { NextRequest, NextResponse } from 'next/server';
import { getPartner, updatePartner, deletePartner } from '@/lib/partners';
import apiError from '@/lib/apiError';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';

async function requireSession(req: NextRequest) {
  return getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession(_req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const partner = await getPartner(parseInt(id));
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

    const { id } = await params;
    const data = await req.json();
    const partner = await updatePartner(parseInt(id), data);
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

    const { id } = await params;
    const deleted = await deletePartner(parseInt(id));
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return apiError(err);
  }
}
