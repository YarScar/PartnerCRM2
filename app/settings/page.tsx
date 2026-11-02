import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SettingsClient } from '@/components/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const cookieStore = await cookies();
  const user = await getSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!user) {
    redirect('/login');
  }

  // The cookie can be older than the latest verification, so read the email from the database.
  const account = await prisma.user.findUnique({
    where: { username: user.username },
    select: { email: true, email_verified: true },
  });
  const { verified } = await searchParams;

  return (
    <SettingsClient
      user={{ ...user, email: account?.email ?? undefined }}
      emailVerified={Boolean(account?.email && account.email_verified)}
      verifyResult={verified === 'success' || verified === 'error' ? verified : undefined}
    />
  );
}
