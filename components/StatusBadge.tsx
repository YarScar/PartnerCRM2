import { PartnerStatus, STATUS_COLORS } from '@/lib/types';

export function StatusBadge({ status, size = 'md' }: { status: PartnerStatus; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-full border ${STATUS_COLORS[status]} ${sizeClasses}`}
    >
      {status}
    </span>
  );
}
