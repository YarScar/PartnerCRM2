import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateSession } from '@/lib/programs';
import { createSession } from '@/lib/programsData';
import { badRequest, readJson, requireUser } from '@/lib/routeHelpers';

/** Adds a dated session to a run; it starts with the program's usual activities. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;

    const checked = validateSession(await readJson(req));
    if (!checked.ok) return badRequest(checked.error);
    const result = await createSession(checked.data);
    if (!result.ok) return badRequest(result.error);
    return NextResponse.json({ session: result.session }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
