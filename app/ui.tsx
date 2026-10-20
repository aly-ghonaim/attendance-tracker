import type { Status } from '@/lib/calc';

export const card = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10';
export const primaryButton =
  'min-h-12 rounded-xl bg-blue-600 px-5 font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50';
export const ghostButton = 'min-h-12 rounded-xl px-5 font-medium text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10';
export const field =
  'min-h-11 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-800';

const STATUS: Record<Status, { label: string; pill: string; bar: string }> = {
  safe: { label: 'On track', pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', bar: 'bg-emerald-500' },
  warning: { label: 'Careful', pill: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300', bar: 'bg-amber-500' },
  barred: { label: 'Over the limit', pill: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300', bar: 'bg-red-500' },
};

export const statusStyle = (s: Status) => STATUS[s];

export function StatusPill({ status }: { status: Status }) {
  const { label, pill } = STATUS[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pill}`}>{label}</span>;
}

/** Misses used out of the allowed misses. */
export function MissBar({ missed, allowed, status }: { missed: number; allowed: number; status: Status }) {
  const pct = allowed === 0 ? (missed > 0 ? 100 : 0) : Math.min(100, (missed / allowed) * 100);
  return (
    <div
      role="progressbar"
      aria-label="Misses used"
      aria-valuemin={0}
      aria-valuemax={allowed}
      aria-valuenow={Math.min(missed, allowed)}
      className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
    >
      <div className={`h-full rounded-full transition-all ${STATUS[status].bar}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
