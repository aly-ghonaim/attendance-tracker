'use client';

import Link from 'next/link';
import { weekly } from '@/lib/schedule';
import { useSaved } from '@/lib/store';
import { card } from '../ui';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Schedule() {
  const saved = useSaved();
  if (saved === undefined) return null; // storage not read yet

  const days = saved ? weekly(saved.courses) : [];
  const today = new Date().getDay();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-12">
      <header className="flex items-center gap-2 pt-2">
        <Link href="/" aria-label="Back to courses" className="flex size-11 items-center justify-center rounded-full text-xl hover:bg-black/5 dark:hover:bg-white/10">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Weekly schedule</h1>
      </header>

      {days.length === 0 && <p className="text-zinc-500">No schedule saved yet.</p>}

      {days.map(d => (
        <section key={d.day} className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-medium text-zinc-500">
            {DAY_NAMES[d.day]}
            {d.day === today && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-300">Today</span>}
          </h2>
          <ul className={`${card} flex flex-col p-0`}>
            {d.items.map((it, i) => (
              <li key={i} className="flex min-h-14 items-center gap-4 border-t border-zinc-100 px-4 first:border-t-0 dark:border-zinc-800">
                <span className="w-12 shrink-0 font-medium tabular-nums">{it.time}</span>
                <span>
                  <span className="block font-medium leading-snug">{it.course}</span>
                  <span className="block text-sm capitalize text-zinc-500">{it.type}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
