import { NextRequest, NextResponse } from 'next/server';
import { listPartners, createPartner } from '@/lib/partners';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

async function requireSession(req: NextRequest) {
  return getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const partners = await listPartners();
    return NextResponse.json({ partners });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const partner = await createPartner(data);
    return NextResponse.json({ partner }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
