import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateActivityList } from '@/lib/programs';
import { setProgramActivities } from '@/lib/programsData';
import { badRequest, notFound, readJson, requireUser, routeId } from '@/lib/routeHelpers';

/** Replaces the program's usual activity plan: [{ activity_id }] in order. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;
    const id = await routeId(params);
    if (id === null) return notFound();

    const checked = validateActivityList(await readJson(req));
    if (!checked.ok) return badRequest(checked.error);
    const result = await setProgramActivities(id, checked.data);
    if (result === 'not_found') return notFound();
    if (result === 'unknown_activity') return badRequest('One of these activities no longer exists. Reload and try again.');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
