import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { loadFormSections } from '@/lib/formConfigLoad';
import { SettingsClient } from '@/components/SettingsClient';

export const dynamic = 'force-dynamic';

const summarize = (sections: Awaited<ReturnType<typeof loadFormSections>>) =>
  sections.map((s) => ({
    id: s.id,
    label: s.label,
    fields: s.fields.map((f) => ({ id: f.id, label: f.label, visible: f.visible, required: f.required })),
  }));

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const cookieStore = await cookies();
  const user = await getSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!user) {
    redirect('/login');
  }

  // The cookie can be older than the latest change, so read name and email from the database.
  const account = await prisma.user.findUnique({
    where: { username: user.username },
    select: { display_name: true, email: true, email_verified: true },
  });
  const { verified } = await searchParams;

  // Admins see what each form currently asks, straight from what was saved.
  const forms = isAdmin(user)
    ? {
        partner: summarize(await loadFormSections('partner')),
        intake: summarize(await loadFormSections('intake')),
      }
    : undefined;

  return (
    <SettingsClient
      user={{ ...user, displayName: account?.display_name ?? user.displayName, email: account?.email ?? undefined }}
      emailVerified={Boolean(account?.email && account.email_verified)}
      verifyResult={verified === 'success' || verified === 'error' ? verified : undefined}
      forms={forms}
    />
  );
}
