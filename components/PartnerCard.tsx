import Link from 'next/link';
import { Partner } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { MapPin, Calendar, Cpu, ArrowUpRight } from 'lucide-react';

export function PartnerCard({ partner }: { partner: Partner }) {
  const lastUpdate = new Date(partner.updated_at);
  const daysAgo = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  const lastUpdateText =
    daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  return (
    <Link
      href={`/partners/${partner.id}`}
      className="group block card hover:border-court/40 hover:shadow-lg hover:-translate-y-0.5
                 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-xl leading-tight mb-1 group-hover:text-court transition-colors">
            {partner.org_name}
          </h3>
          {partner.contact_name && (
            <p className="text-sm text-ink/60">
              {partner.contact_name}
              {partner.contact_role && <span className="text-ink/40"> · {partner.contact_role}</span>}
            </p>
          )}
        </div>
        <ArrowUpRight
          size={18}
          className="text-ink/30 group-hover:text-court group-hover:rotate-12 transition-all flex-shrink-0"
        />
      </div>

      <div className="mb-4">
        <StatusBadge status={partner.status} size="sm" />
      </div>

      <div className="space-y-1.5 text-xs text-ink/70">
        {(partner.org_city || partner.org_state) && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-ink/40" />
            {[partner.org_city, partner.org_state].filter(Boolean).join(', ')}
          </div>
        )}
        {partner.desired_program_type && (
          <div className="flex items-center gap-1.5">
            <Cpu size={12} className="text-ink/40" />
            <span className="truncate">{partner.desired_program_type}</span>
          </div>
        )}
        {partner.desired_timeline && (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-ink/40" />
            <span className="truncate">{partner.desired_timeline}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-[10px] uppercase tracking-wider text-ink/40">
        <span>Updated {lastUpdateText}</span>
        {partner.notes && partner.notes.length > 0 && (
          <span>{partner.notes.length} note{partner.notes.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </Link>
  );
}
