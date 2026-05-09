import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { SettingsClient } from '@/components/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const user = await getSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!user) {
    redirect('/login');
  }

  return <SettingsClient user={user} />;
}
