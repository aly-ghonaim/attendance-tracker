'use client';

import Link from 'next/link';
import { calc, status, worst } from '@/lib/calc';
import { useSaved } from '@/lib/store';
import { card, MissBar, StatusPill } from '../ui';

export default function Courses() {
  const saved = useSaved();
  if (saved === undefined) return null; // storage not read yet

  if (saved === null) return <main className="p-4"><Link href="/" className="font-medium text-blue-600">Load a schedule first</Link></main>;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-12">
      <header className="flex items-center gap-2 pt-2">
        <Link href="/" aria-label="Back to days" className="flex size-11 items-center justify-center rounded-full text-xl hover:bg-black/5 dark:hover:bg-white/10">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">By course</h1>
      </header>

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
