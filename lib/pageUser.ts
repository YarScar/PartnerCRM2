import { cookies } from 'next/headers';
import { getSessionFromToken, SESSION_COOKIE_NAME } from './auth';

/** The signed-in user for a server page (middleware has already required one). */
export async function pageUser() {
  return getSessionFromToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
}
