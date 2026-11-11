import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateSession } from '@/lib/programs';
import { deleteSession, updateSession } from '@/lib/programsData';
import { badRequest, notFound, readJson, requireUser, routeId } from '@/lib/routeHelpers';

type Ctx = { params: Promise<{ id: string }> };

/** Edits a session; send only the fields that change (e.g. just { tasks } to tick a box). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;
    const id = await routeId(params);
    if (id === null) return notFound();

    const checked = validateSession(await readJson(req), { partial: true });
    if (!checked.ok) return badRequest(checked.error);
    const session = await updateSession(id, checked.data);
    return session ? NextResponse.json({ session }) : notFound();
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

    const runId = await deleteSession(id);
    return runId === null ? notFound() : NextResponse.json({ ok: true, run_id: runId });
  } catch (err) {
    return apiError(err);
  }
}
