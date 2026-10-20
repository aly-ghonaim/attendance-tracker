'use client';

import Link from 'next/link';
import { calc, fmt, sessions, status, worst } from '@/lib/calc';
import { updateCourse, useSaved, type SavedCourse } from '@/lib/store';
import { dayLabel, SessionRow } from '../../session-row';
import { card, statusStyle } from '../../ui';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DayView({ day }: { day: number }) {
  const saved = useSaved();
  if (saved === undefined) return null; // storage not read yet

  if (!saved || !Number.isInteger(day) || day < 0 || day > 6)
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
        <p>Day not found.</p>
        <Link href="/" className="font-medium text-blue-600 dark:text-blue-400">Back to your week</Link>
      </main>
    );

  const today = fmt(new Date());
  // Every past date that falls on this weekday, newest first, each date's classes in time order.
  const entries = saved.courses
    .flatMap((course, i) =>
      sessions(course)
        .filter(s => s.date <= today && new Date(`${s.date}T00:00`).getDay() === day)
        .map(s => ({ s, i })),
    )
    .sort((a, b) => a.s.time.localeCompare(b.s.time));
  const dates = [...Map.groupBy(entries, e => e.s.date)].sort(([a], [b]) => b.localeCompare(a));

  // Courses meeting on this weekday, with misses left.
  const meeting = saved.courses
    .map((c, i) => ({ c, i, groups: calc(c, saved.defaultRate) }))
    .filter(({ c, groups }) => groups.length > 0 && c.slots.some(s => s.day === day));

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-12">
      <header className="flex items-center gap-2 pt-2">
        <Link href="/" aria-label="Back to your week" className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl hover:bg-black/5 dark:hover:bg-white/10">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{DAY_NAMES[day]}</h1>
      </header>

      <ul className={`${card} flex flex-col gap-2`}>
        {meeting.map(({ c, i, groups }) => {
          const g = worst(groups);
          return (
            <li key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{c.name}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${statusStyle(status(g.left)).pill}`}>
                {g.left} left · {g.missed}/{g.allowed} missed
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-zinc-500">Tap a class you missed. Use Cancel if the uni cancelled it.</p>
      {dates.length === 0 && <p className="text-zinc-500">No {DAY_NAMES[day]} classes have happened yet this term.</p>}

      {dates.map(([date, list]) => (
        <section key={date} className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-medium text-zinc-500">{dayLabel(date)}</h2>
          <ul className={`${card} flex flex-col p-0`}>
            {list.map(({ s, i }) => {
              const course = saved.courses[i];
              const edit = (patch: (c: SavedCourse) => SavedCourse) => updateCourse(saved, i, patch);
              return <SessionRow key={`${i}|${s.key}`} s={s} course={course} edit={edit} title={course.name} subtitle={`${s.time} · ${s.type}`} />;
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
