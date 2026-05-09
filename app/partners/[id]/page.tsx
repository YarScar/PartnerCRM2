import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getPartner } from '@/lib/partners';
import { PartnerDetailClient } from './PartnerDetailClient';
import { ArrowLeft } from 'lucide-react';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = await getPartner(parseInt(id));
  if (!partner) notFound();
  const user = await getSessionFromToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink mb-6"
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>
      <PartnerDetailClient partner={partner} canDelete={isAdmin(user)} />
    </div>
  );
}
