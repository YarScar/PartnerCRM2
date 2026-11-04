import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatAges } from '@/lib/programs';

/** Small display pieces shared by the Programs and Activities pages. */

export function Goals({ goals }: { goals: string[] }) {
  if (!goals.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {goals.map((g) => (
        <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-court/10 text-court font-medium">
          {g}
        </span>
      ))}
    </div>
  );
}

export function Ages({ min, max, prefix = 'Ages ' }: { min: number | null; max: number | null; prefix?: string }) {
  const ages = formatAges(min, max);
  return ages ? <span>{prefix}{ages}</span> : <span className="text-ink/40">Any age</span>;
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink mb-6">
      <ArrowLeft size={14} />
      {label}
    </Link>
  );
}

export function PageHeading({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-ink/50 mb-2">{kicker}</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <div>
      <div className="label-base">{label}</div>
      <div className="text-sm whitespace-pre-wrap">{children}</div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Planned: 'bg-ink/10 text-ink',
  Active: 'bg-court/15 text-court',
  Completed: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-ink/5 text-ink/50 line-through',
};

export function RunStatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[status] ?? STATUS_STYLES.Planned}`}>
      {status}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-ink/50 py-6 text-center">{children}</div>;
}
