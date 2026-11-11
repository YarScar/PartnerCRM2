import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateActivity } from '@/lib/programs';
import { createActivity } from '@/lib/programsData';
import { badRequest, readJson, requireUser } from '@/lib/routeHelpers';

/** Adds an activity to the library; with based_on_id it is a twist of that one. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;

    const checked = validateActivity(await readJson(req));
    if (!checked.ok) return badRequest(checked.error);
    const result = await createActivity(checked.data);
    if (!result.ok) return badRequest(result.error);
    return NextResponse.json({ activity: result.activity }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
