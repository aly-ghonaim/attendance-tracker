import { fmt, sessions, type Course, type Session } from './calc';

export type Entry = { s: Session; i: number }; // i = index of the course in the saved list
export type Week = { start: string; number: number; days: { date: string; items: Entry[] }[] };

const DAY_MS = 86_400_000;

// The uni week runs Saturday to Friday (the academic calendar's rows start on Saturdays).
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
  return fmt(d);
}

/** Teaching weeks that have at least one class, each with its dated days (holiday classes included, flagged). */
export function weeks(courses: Course[]): Week[] {
  const entries = courses
    .flatMap((c, i) => sessions(c).map(s => ({ s, i })))
    .sort((a, b) => a.s.date.localeCompare(b.s.date) || a.s.time.localeCompare(b.s.time) || a.i - b.i);
  const byWeek = [...Map.groupBy(entries, e => weekStart(e.s.date))].sort(([a], [b]) => a.localeCompare(b));
  const first = byWeek[0]?.[0];
  return byWeek.map(([start, list]) => ({
    start,
    number: Math.round((new Date(`${start}T00:00`).getTime() - new Date(`${first}T00:00`).getTime()) / (7 * DAY_MS)) + 1,
    days: [...Map.groupBy(list, e => e.s.date)].map(([date, items]) => ({ date, items })),
  }));
}

/** Index of the week containing `today`; before the term it is the first week, after it the last. */
export function pickWeek(all: Week[], today: string): number {
  const current = weekStart(today);
  const i = all.findLastIndex(w => w.start <= current);
  return Math.max(i, 0);
}
