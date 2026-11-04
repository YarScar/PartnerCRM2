import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateProgram } from '@/lib/programs';
import { deleteProgram, updateProgram } from '@/lib/programsData';
import { badRequest, notFound, readJson, requireUser, routeId } from '@/lib/routeHelpers';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;
    const id = await routeId(params);
    if (id === null) return notFound();

    const checked = validateProgram(await readJson(req), { partial: true });
    if (!checked.ok) return badRequest(checked.error);
    const program = await updateProgram(id, checked.data);
    return program ? NextResponse.json({ program }) : notFound();
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

    return (await deleteProgram(id)) ? NextResponse.json({ ok: true }) : notFound();
  } catch (err) {
    return apiError(err);
  }
}
