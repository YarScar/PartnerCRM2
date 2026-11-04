import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateActivityList } from '@/lib/programs';
import { setRunActivities } from '@/lib/programsData';
import { badRequest, notFound, readJson, requireUser, routeId } from '@/lib/routeHelpers';

/** Replaces what this run did: [{ activity_id, notes }] in order. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;
    const id = await routeId(params);
    if (id === null) return notFound();

    const checked = validateActivityList(await readJson(req), { withNotes: true });
    if (!checked.ok) return badRequest(checked.error);
    const result = await setRunActivities(id, checked.data);
    if (result === 'not_found') return notFound();
    if (result === 'unknown_activity') return badRequest('One of these activities no longer exists. Reload and try again.');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
