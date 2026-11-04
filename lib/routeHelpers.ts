import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME, type AuthUser } from './auth';
import { parseId } from './parseId';

/** The signed-in user, or a 401/403 response to return as-is. */
export async function requireUser(req: NextRequest, { admin = false } = {}): Promise<AuthUser | NextResponse> {
  const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (admin && !isAdmin(user)) return NextResponse.json({ error: 'Only an admin can delete this' }, { status: 403 });
  return user;
}

/** The request body, or undefined when it is not JSON. */
export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export async function routeId(params: Promise<{ id: string }>) {
  return parseId((await params).id);
}

export const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });
export const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404 });
