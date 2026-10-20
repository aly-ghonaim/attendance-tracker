'use client';

import Link from 'next/link';
import { useState } from 'react';
import { attendance, calc, fmt, REQUIRED_RATE, status, worst } from '@/lib/calc';
import { pickWeek, weeks } from '@/lib/schedule';
import { uelTerm1 } from '@/lib/sample';
import { fromExtraction, save, updateCourse, useSaved, type SavedCourse } from '@/lib/store';
import { dayLabel, SessionRow } from './session-row';
import { card, ghostButton, primaryButton, statusStyle } from './ui';

const headerLink = 'flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-600/10 dark:text-blue-400';
const arrow = 'flex size-11 items-center justify-center rounded-full text-xl hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/10';
const short = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function Home() {
  const saved = useSaved();
  const [picked, setPicked] = useState<number | null>(null);
  if (saved === undefined) return null; // storage not read yet

  if (saved === null)
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 p-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Attendance tracker</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Upload your timetable and academic calendar. We work out how many classes you can still miss.
          </p>
        </div>
        <button className={primaryButton} onClick={() => save(fromExtraction(uelTerm1))}>
          Load my UEL schedule
        </button>
        <Link href="/setup" className={`${ghostButton} flex items-center justify-center`}>
          Upload a different schedule
        </Link>
      </main>
    );

  const today = fmt(new Date());
  const all = weeks(saved.courses);
  const index = Math.min(picked ?? pickWeek(all, today), all.length - 1);
  const week = all[index];

  const counters = saved.courses
    .map((course, i) => ({ course, i, groups: calc(course, REQUIRED_RATE) }))
    .filter(c => c.groups.length > 0);
  const { held, attended } = attendance(saved.courses, today);
  const rate = held === 0 ? null : (attended / held) * 100;
  // Courses have separate limits, so a course already over its limit adds nothing.
  const missesLeft = counters.reduce((n, { groups }) => n + Math.max(0, worst(groups).left), 0);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-12">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <Link href="/setup" className={headerLink}>Replace</Link>
      </header>

      <section className={`${card} flex flex-col gap-1`}>
        {counters.map(({ course, i, groups }) => {
          const g = worst(groups);
          return (
            <Link key={i} href={`/course/${i}`} className="flex min-h-11 items-center justify-between gap-3">
              <span className="font-medium leading-snug">{course.name}</span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${statusStyle(status(g.left)).pill}`}>
                {g.left} left · {g.missed}/{g.allowed}
              </span>
            </Link>
          );
        })}
        <dl className="mt-1 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 text-center dark:border-zinc-800">
          <div>
            <dt className="text-xs text-zinc-500">Required</dt>
            <dd className="text-lg font-semibold tabular-nums">{REQUIRED_RATE}%</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Your attendance</dt>
            <dd
              className={`text-lg font-semibold tabular-nums ${rate !== null && rate < REQUIRED_RATE ? 'text-red-600 dark:text-red-400' : ''}`}
            >
              {rate === null ? '—' : `${Math.round(rate)}%`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Misses left</dt>
            <dd className="text-lg font-semibold tabular-nums">{missesLeft}</dd>
          </div>
        </dl>
      </section>

      {week ? (
        <>
          <nav className="flex items-center justify-between">
            <button className={arrow} aria-label="Previous week" disabled={index === 0} onClick={() => setPicked(index - 1)}>←</button>
            <div className="text-center">
              <div className="font-semibold">Week {week.number}</div>
              <div className="text-sm text-zinc-500">
                {short(week.start)} – {short(week.days.at(-1)!.date)}
              </div>
            </div>
            <button className={arrow} aria-label="Next week" disabled={index === all.length - 1} onClick={() => setPicked(index + 1)}>→</button>
          </nav>

          <p className="text-sm text-zinc-500">Tap a class you missed. Use Cancel if the uni cancelled it.</p>

          {week.days.map(day => (
            <section key={day.date} className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 px-1 text-sm font-medium text-zinc-500">
                {dayLabel(day.date)}
                {day.date === today && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-300">Today</span>
                )}
              </h2>
              <ul className={`${card} flex flex-col p-0`}>
                {day.items.map(({ s, i }) => {
                  const course = saved.courses[i];
                  const edit = (patch: (c: SavedCourse) => SavedCourse) => updateCourse(saved, i, patch);
                  return <SessionRow key={`${i}|${s.key}`} s={s} course={course} edit={edit} title={course.name} subtitle={`${s.time} · ${s.type}`} />;
                })}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <p className="text-zinc-500">No classes between the start and end dates. Check them in Replace.</p>
      )}
    </main>
  );
}
