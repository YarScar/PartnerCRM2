import Link from 'next/link';
import { listPartners } from '@/lib/partners';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
  const partners = await listPartners();

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink/50 mb-2">
            02 — Directory
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold">All Partners</h1>
        </div>
        <Link href="/partners/new" className="btn-primary">
          <Plus size={16} /> Add Partner
        </Link>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-ink/5 text-[10px] uppercase tracking-wider text-ink/60 font-semibold">
          <div className="col-span-4">Organization</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-3">Program Interest</div>
          <div className="col-span-1 text-right">View</div>
        </div>
        <div className="divide-y divide-ink/10">
          {partners.map((p) => (
            <Link
              key={p.id}
              href={`/partners/${p.id}`}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-court/5 transition-colors items-center group"
            >
              <div className="col-span-4">
                <div className="font-semibold group-hover:text-court transition-colors">
                  {p.org_name}
                </div>
                {p.contact_name && (
                  <div className="text-xs text-ink/50">{p.contact_name}</div>
                )}
              </div>
              <div className="col-span-2">
                <StatusBadge status={p.status} size="sm" />
              </div>
              <div className="col-span-2 text-sm text-ink/70">
                {[p.org_city, p.org_state].filter(Boolean).join(', ') || '—'}
              </div>
              <div className="col-span-3 text-sm text-ink/70 truncate">
                {p.desired_program_type || '—'}
              </div>
              <div className="col-span-1 flex justify-end">
                <ArrowUpRight
                  size={16}
                  className="text-ink/30 group-hover:text-court transition-colors"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
