'use client';

import Link from 'next/link';
import { calc, fmt, sessions, status } from '@/lib/calc';
import { updateCourse, useSaved, type SavedCourse } from '@/lib/store';
import { dayLabel, SessionRow } from '../../session-row';
import { card, MissBar, StatusPill } from '../../ui';

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
        <Link href="/courses" className="font-medium text-blue-600 dark:text-blue-400">Back to courses</Link>
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
        <Link href="/courses" aria-label="Back to courses" className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl hover:bg-black/5 dark:hover:bg-white/10">
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
              <SessionRow key={s.key} s={s} course={course} edit={edit} title={dayLabel(s.date)} subtitle={`${s.time} · ${s.type}`} />
            ))}
          </ul>
        </section>
      ))}

      {upcoming > 0 && <p className="px-1 text-sm text-zinc-500">{upcoming} more classes later this term.</p>}
    </main>
  );
}
