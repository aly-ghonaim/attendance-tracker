'use client';

import Link from 'next/link';
import { calc, status, type Group } from '@/lib/calc';
import { uelTerm1 } from '@/lib/sample';
import { fromExtraction, save, useSaved } from '@/lib/store';
import { card, field, ghostButton, MissBar, primaryButton, StatusPill } from './ui';

// A course is as safe as its worst session type.
const worst = (groups: Group[]) => groups.reduce((a, g) => (g.left < a.left ? g : a));

export default function Home() {
  const saved = useSaved();
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
        <button className={primaryButton} onClick={() => save(fromExtraction(uelTerm1, 70))}>
          Load my UEL schedule
        </button>
        <Link href="/setup" className={`${ghostButton} flex items-center justify-center`}>
          Upload a different schedule
        </Link>
      </main>
    );

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-12">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your courses</h1>
        <div className="flex">
          <Link href="/schedule" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-600/10 dark:text-blue-400">
            Schedule
          </Link>
          <Link href="/setup" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-600/10 dark:text-blue-400">
            Replace
          </Link>
        </div>
      </header>

      <label className={`${card} flex items-center justify-between gap-3`}>
        <span className="text-sm font-medium">Required attendance</span>
        <span className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            className={`${field} w-20 text-right`}
            value={saved.defaultRate}
            onChange={e => save({ ...saved, defaultRate: Math.min(100, Math.max(0, Number(e.target.value))) })}
          />
          %
        </span>
      </label>

      <ul className="flex flex-col gap-3">
        {saved.courses.map((c, i) => {
          const groups = calc(c, saved.defaultRate);
          if (groups.length === 0)
            return (
              <li key={i} className={card}>
                <b>{c.name}</b>
                <p className="mt-1 text-sm text-zinc-500">No classes between the start and end dates. Check them in Replace schedule.</p>
              </li>
            );
          const g = worst(groups);
          const s = status(g.left);
          return (
            <li key={i}>
              <Link href={`/course/${i}`} className={`${card} flex flex-col gap-3 transition-shadow hover:shadow-md`}>
                <div className="flex items-start justify-between gap-3">
                  <b className="text-lg leading-snug">{c.name}</b>
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
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
