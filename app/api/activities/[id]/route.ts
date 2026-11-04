import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateActivity } from '@/lib/programs';
import { deleteActivity, updateActivity } from '@/lib/programsData';
import { badRequest, notFound, readJson, requireUser, routeId } from '@/lib/routeHelpers';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;
    const id = await routeId(params);
    if (id === null) return notFound();

    const checked = validateActivity(await readJson(req), { partial: true });
    if (!checked.ok) return badRequest(checked.error);
    const activity = await updateActivity(id, checked.data);
    return activity ? NextResponse.json({ activity }) : notFound();
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser(req, { admin: true });
    if (user instanceof NextResponse) return user;
    const id = await routeId(params);
    if (id === null) return notFound();

    const result = await deleteActivity(id);
    if (result === 'not_found') return notFound();
    if (result === 'in_use') {
      return NextResponse.json(
        { error: 'A program run used this activity, so it stays to keep that history. Edit it or make a new twist instead.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
