import Link from 'next/link';
import { listPartners } from '@/lib/partners';
import { hasDb } from '@/lib/db';
import { PARTNER_STATUSES, PartnerStatus } from '@/lib/types';
import { DashboardClient } from './DashboardClient';
import { Plus, Database, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const partners = await listPartners();

  // Compute counts by status
  const counts = PARTNER_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: partners.filter((p) => p.status === s).length }),
    {} as Record<PartnerStatus, number>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink/50 mb-2">
            01 — Overview
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-ink/60 mt-2">
            {partners.length} partner{partners.length !== 1 ? 's' : ''} tracked.
            Last activity {new Date(partners[0]?.updated_at || Date.now()).toLocaleDateString()}.
          </p>
        </div>
        <Link href="/partners/new" className="btn-primary">
          <Plus size={16} />
          Add Partner
        </Link>
      </div>

      {/* DB status banner */}
      {!hasDb() && (
        <div className="mb-8 flex items-start gap-3 bg-cream-soft border border-court/30 rounded-2xl p-4">
          <AlertCircle size={18} className="text-court flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold mb-0.5">Running in mock data mode</div>
            <p className="text-ink/60">
              Set <code className="font-mono text-xs bg-ink/5 px-1.5 py-0.5 rounded">DATABASE_URL</code> in
              your <code className="font-mono text-xs bg-ink/5 px-1.5 py-0.5 rounded">.env.local</code> to connect Neon.
              Then run <code className="font-mono text-xs bg-ink/5 px-1.5 py-0.5 rounded">npm run db:init</code>.
            </p>
          </div>
        </div>
      )}

      {hasDb() && (
        <div className="mb-8 flex items-center gap-2 text-xs text-emerald-700">
          <Database size={14} />
          Connected to Neon Postgres
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12 stagger">
        {PARTNER_STATUSES.map((status) => (
          <div
            key={status}
            className="card !p-4 flex flex-col justify-between min-h-[100px]"
          >
            <div className="text-[10px] uppercase tracking-wider text-ink/50 leading-tight">
              {status}
            </div>
            <div className="font-display text-3xl font-bold tabular-nums mt-2">
              {counts[status]}
            </div>
          </div>
        ))}
      </div>

      <DashboardClient initialPartners={partners} />
    </div>
  );
}
