'use client';

import Link from 'next/link';
import { calc, fmt, sessions, status, toggle, type Session } from '@/lib/calc';
import { updateCourse, useSaved, type SavedCourse } from '@/lib/store';
import { card, MissBar, StatusPill } from '../../ui';

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

// Monday of the session's week, as an ISO date, for grouping.
function weekStart(iso: string) {
  const d = new Date(`${iso}T00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return fmt(d);
}

export default function CourseView({ index }: { index: number }) {
  const saved = useSaved();
  if (saved === undefined) return null; // storage not read yet

  const course = saved?.courses[index];
  if (!saved || !course)
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
        <p>Course not found.</p>
        <Link href="/" className="font-medium text-blue-600 dark:text-blue-400">Back to courses</Link>
      </main>
    );

  const edit = (patch: (c: SavedCourse) => SavedCourse) => updateCourse(saved, index, patch);
  const groups = calc(course, saved.defaultRate);
  const all = sessions(course);
  const today = fmt(new Date());
  const past = all.filter(s => s.date <= today);
  const upcoming = all.filter(s => s.date > today && !s.holiday).length;
  // Newest week first, days in calendar order inside each week.
  const weeks = [...Map.groupBy(past, s => weekStart(s.date))].sort(([a], [b]) => b.localeCompare(a));
  const types = new Set(course.slots.map(s => s.type));

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-12">
      <header className="flex items-center gap-2 pt-2">
        <Link href="/" aria-label="Back to courses" className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl hover:bg-black/5 dark:hover:bg-white/10">
          ←
        </Link>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">{course.name}</h1>
      </header>

      {groups.length === 0 && <p className={`${card} text-sm text-zinc-500`}>No classes between the start and end dates.</p>}
      {groups.map(g => {
        const s = status(g.left);
        return (
          <section key={g.name} className={`${card} flex flex-col gap-3`}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{g.name}</span>
              <StatusPill status={s} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-semibold tabular-nums tracking-tight">{g.left}</span>
              <span className="text-sm text-zinc-500">{g.left === 1 ? 'miss' : 'misses'} left</span>
            </div>
            <MissBar missed={g.missed} allowed={g.allowed} status={s} />
            <p className="text-sm text-zinc-500">
              {g.missed} missed of {g.allowed} allowed · {g.total} classes this term
            </p>
          </section>
        );
      })}

      {types.size > 1 && (
        <label className={`${card} flex min-h-14 items-center justify-between gap-3 text-sm`}>
          Count {[...types].join(' and ')} separately
          <input
            type="checkbox"
            className="size-6 accent-blue-600"
            checked={course.mode === 'type'}
            onChange={e => edit(c => ({ ...c, mode: e.target.checked ? 'type' : 'all' }))}
          />
        </label>
      )}

      <p className="text-sm text-zinc-500">Tap a class you missed. Use Cancel if the uni cancelled it.</p>

      {weeks.map(([week, list]) => (
        <section key={week} className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-medium text-zinc-500">Week of {dayLabel(week)}</h2>
          <ul className={`${card} flex flex-col p-0`}>
            {list.map(s => (
              <SessionRow key={s.key} s={s} course={course} edit={edit} />
            ))}
          </ul>
        </section>
      ))}

      {upcoming > 0 && <p className="px-1 text-sm text-zinc-500">{upcoming} more classes later this term.</p>}
    </main>
  );
}

type RowProps = { s: Session; course: SavedCourse; edit: (patch: (c: SavedCourse) => SavedCourse) => void };

function SessionRow({ s, course, edit }: RowProps) {
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
          <span className="block font-medium">{dayLabel(s.date)}</span>
          <span className="block text-sm capitalize text-zinc-500">
            {s.time} · {s.type}
          </span>
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
