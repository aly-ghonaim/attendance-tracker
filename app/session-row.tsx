'use client';

import { toggle, type Session } from '@/lib/calc';
import type { SavedCourse } from '@/lib/store';

export const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

type Props = {
  s: Session;
  course: SavedCourse;
  edit: (patch: (c: SavedCourse) => SavedCourse) => void;
  title: string;
  subtitle: string;
};

/** One class: tap to toggle Missed, plus a Cancel button. Holidays are not tappable. */
export function SessionRow({ s, course, edit, title, subtitle }: Props) {
  const cancelled = course.cancelled.includes(s.key);
  const missed = course.missed.includes(s.key);
  const dayOff = s.holiday;

  const state = dayOff
    ? { label: 'Holiday', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' }
    : cancelled
      ? { label: 'Cancelled', cls: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' }
      : missed
        ? { label: 'Missed', cls: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' }
        : { label: 'Attended', cls: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' };

  return (
    <li className="flex items-center border-t border-zinc-100 first:border-t-0 dark:border-zinc-800">
      <button
        disabled={dayOff || cancelled}
        aria-pressed={missed}
        onClick={() => edit(c => ({ ...c, missed: toggle(c.missed, s.key) }))}
        className="flex min-h-14 flex-1 items-center justify-between gap-2 rounded-l-2xl px-4 text-left active:bg-black/5 disabled:cursor-default disabled:active:bg-transparent dark:active:bg-white/10"
      >
        <span className={dayOff || cancelled ? 'text-zinc-500' : ''}>
          <span className="block font-medium">{title}</span>
          <span className="block text-sm capitalize text-zinc-500">{subtitle}</span>
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${state.cls}`}>{state.label}</span>
      </button>
      {!dayOff && (
        <button
          onClick={() => edit(c => ({ ...c, cancelled: toggle(c.cancelled, s.key) }))}
          className="min-h-14 rounded-r-2xl px-4 text-sm font-medium text-zinc-600 active:bg-black/5 dark:text-zinc-300 dark:active:bg-white/10"
        >
          {cancelled ? 'Restore' : 'Cancel'}
        </button>
      )}
    </li>
  );
}
