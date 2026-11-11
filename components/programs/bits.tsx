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

/** "Programs › Launchpad › 3D Geospatial Club" — every step but the last is a link. */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink/60 mb-6">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-ink/30">›</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-ink underline-offset-2 hover:underline">{item.label}</Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** The link to a partner's programs page ("own" for programs with no partner). */
export function partnerProgramsHref(partnerId: number | null | undefined) {
  return `/programs/partners/${partnerId ?? 'own'}`;
}

/**
 * Every Programs/Activities page title: an optional small label above (only when it adds
 * something the title doesn't say), the title, an optional facts line, and the page's
 * actions on the right. One size everywhere so pages feel like one product.
 */
export function PageHeading({
  kicker,
  title,
  meta,
  children,
}: {
  kicker?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
      <div className="min-w-0">
        {kicker && <div className="text-xs uppercase tracking-widest text-ink/50 mb-1.5">{kicker}</div>}
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {meta && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">{meta}</div>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
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

/** Underlined section tabs, as links (each tab has its own URL, so back/forward and sharing work). */
export function Tabs({ tabs, label }: { tabs: { href: string; label: React.ReactNode; active: boolean }[]; label: string }) {
  return (
    <nav className="flex gap-1 border-b border-ink/10 mb-6 overflow-x-auto" aria-label={label}>
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? 'page' : undefined}
          className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 whitespace-nowrap ${t.active ? 'border-ink text-ink' : 'border-transparent text-ink/60 hover:text-ink'}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** A titled white panel; `flush` for lists that run edge to edge. */
export function Panel({
  title,
  count,
  action,
  flush = false,
  children,
}: {
  title?: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`card overflow-hidden ${flush ? '!p-0' : ''}`}>
      {title && (
        <div className={`flex items-center justify-between gap-3 ${flush ? 'px-5 pt-4 pb-2' : 'mb-3'}`}>
          <h2 className="font-display text-lg font-bold">
            {title}
            {count != null && <span className="ml-1.5 text-sm font-normal text-ink/50">{count}</span>}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
