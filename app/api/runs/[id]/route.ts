import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateRun } from '@/lib/programs';
import { deleteRun, updateRun } from '@/lib/programsData';
import { badRequest, notFound, readJson, requireUser, routeId } from '@/lib/routeHelpers';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;
    const id = await routeId(params);
    if (id === null) return notFound();

    const checked = validateRun(await readJson(req), { partial: true });
    if (!checked.ok) return badRequest(checked.error);
    const result = await updateRun(id, checked.data);
    if (!result) return notFound();
    if (!result.ok) return badRequest(result.error);
    return NextResponse.json({ run: result.run });
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

    return (await deleteRun(id)) ? NextResponse.json({ ok: true }) : notFound();
  } catch (err) {
    return apiError(err);
  }
}
