'use client';

import Link from 'next/link';
import { calc, status, worst } from '@/lib/calc';
import { weekly } from '@/lib/schedule';
import { uelTerm1 } from '@/lib/sample';
import { fromExtraction, save, useSaved } from '@/lib/store';
import { card, field, ghostButton, primaryButton, statusStyle } from './ui';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const headerLink = 'flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-600/10 dark:text-blue-400';

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

  const days = weekly(saved.courses);
  const today = new Date().getDay();
  // Misses left per course, as its worst session type; null when it has no classes in range.
  const left = saved.courses.map(c => {
    const groups = calc(c, saved.defaultRate);
    return groups.length ? worst(groups).left : null;
  });

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-12">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your week</h1>
        <div className="flex">
          <Link href="/courses" className={headerLink}>By course</Link>
          <Link href="/setup" className={headerLink}>Replace</Link>
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
        {days.map(d => (
          <li key={d.day}>
            <Link href={`/day/${d.day}`} className={`${card} flex flex-col gap-1 transition-shadow hover:shadow-md`}>
              <div className="flex items-center justify-between">
                <b className="text-lg">{DAY_NAMES[d.day]}</b>
                {d.day === today && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">Today</span>
                )}
              </div>
              <ul className="flex flex-col">
                {d.items.map((it, i) => {
                  const l = left[it.index];
                  return (
                    <li key={i} className="flex min-h-11 items-center gap-3 border-t border-zinc-100 first:border-t-0 dark:border-zinc-800">
                      <span className="w-12 shrink-0 font-medium tabular-nums">{it.time}</span>
                      <span className="flex-1 leading-snug">
                        {it.course} <span className="text-sm capitalize text-zinc-500">· {it.type}</span>
                      </span>
                      {l !== null && (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${statusStyle(status(l)).pill}`}>{l} left</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
