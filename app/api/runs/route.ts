import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateRun } from '@/lib/programs';
import { createRun } from '@/lib/programsData';
import { badRequest, readJson, requireUser } from '@/lib/routeHelpers';

/** Creates a run of a program; it starts with the program's usual activities. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;

    const checked = validateRun(await readJson(req));
    if (!checked.ok) return badRequest(checked.error);
    const result = await createRun(checked.data);
    if (!result.ok) return badRequest(result.error);
    return NextResponse.json({ run: result.run }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
