import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { validateProgram } from '@/lib/programs';
import { createProgram } from '@/lib/programsData';
import { badRequest, readJson, requireUser } from '@/lib/routeHelpers';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (user instanceof NextResponse) return user;

    const checked = validateProgram(await readJson(req));
    if (!checked.ok) return badRequest(checked.error);
    const program = await createProgram(checked.data);
    return NextResponse.json({ program }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
