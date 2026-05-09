import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPartner } from '@/lib/partners';
import { PartnerForm } from '@/components/PartnerForm';

export const dynamic = 'force-dynamic';

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = await getPartner(parseInt(id));
  if (!partner) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href={`/partners/${partner.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink mb-6"
      >
        <ArrowLeft size={14} />
        Back to {partner.org_name}
      </Link>
      <div className="text-xs uppercase tracking-widest text-ink/50 mb-2">
        Editing
      </div>
      <h1 className="font-display text-5xl md:text-6xl font-bold mb-10 tracking-tight">
        {partner.org_name}
      </h1>
      <PartnerForm partner={partner} mode="edit" />
    </div>
  );
}
