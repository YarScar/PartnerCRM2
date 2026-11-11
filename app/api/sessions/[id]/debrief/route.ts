import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateDebrief } from '@/lib/programs';
import { saveDebrief } from '@/lib/programsData';
import { badRequest, notFound, readJson, requireUser, routeId } from '@/lib/routeHelpers';

/** Saves the session's debrief (creates it, or replaces it when edited). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;
    const id = await routeId(params);
    if (id === null) return notFound();

    const checked = validateDebrief(await readJson(req));
    if (!checked.ok) return badRequest(checked.error);
    const debrief = await saveDebrief(id, checked.data, user.displayName || user.username);
    return debrief ? NextResponse.json({ debrief }) : notFound();
  } catch (err) {
    return apiError(err);
  }
}
