'use client';

import { useState, useMemo } from 'react';
import { Partner, PARTNER_STATUSES, PartnerStatus } from '@/lib/types';
import { PartnerCard } from '@/components/PartnerCard';
import { Search, X } from 'lucide-react';

export function DashboardClient({ initialPartners }: { initialPartners: Partner[] }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | 'All'>('All');

  const filtered = useMemo(() => {
    return initialPartners.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack = [
          p.org_name,
          p.contact_name,
          p.org_city,
          p.org_state,
          p.desired_program_type,
          p.who_they_work_with,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [initialPartners, query, statusFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search partners..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-base pl-9"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['All', ...PARTNER_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${statusFilter === s
                  ? 'bg-ink text-cream border-ink'
                  : 'bg-transparent text-ink/70 border-ink/15 hover:border-ink/40'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4 text-xs uppercase tracking-wider text-ink/50">
        <span>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {(query || statusFilter !== 'All') && ' (filtered)'}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-ink/50">No partners match the current filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((p) => (
            <PartnerCard key={p.id} partner={p} />
          ))}
        </div>
      )}
    </div>
  );
}
