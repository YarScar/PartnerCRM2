import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PartnerForm } from '@/components/PartnerForm';

export default function NewPartnerPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink mb-6"
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>
      <div className="text-xs uppercase tracking-widest text-ink/50 mb-2">
        + Add Partner
      </div>
      <h1 className="font-display text-5xl md:text-6xl font-bold mb-2 tracking-tight">
        New Partner
      </h1>
      <p className="text-ink/60 mb-10">
        Capture the full picture so the team can assess fit and prepare quickly.
      </p>
      <PartnerForm mode="create" />
    </div>
  );
}
