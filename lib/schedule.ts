import type { Slot } from './calc';

export type WeekItem = { time: string; course: string; index: number; type: string };
export type WeekDay = { day: number; items: WeekItem[] };

// The uni week starts on Saturday (0=Sun..6=Sat).
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

/** Weekly timetable: only days with classes, each sorted by start time. */
export function weekly(courses: { name: string; slots: Slot[] }[]): WeekDay[] {
  return WEEK_ORDER.map(day => ({
    day,
    items: courses
      .flatMap((c, index) => c.slots.filter(s => s.day === day).map(s => ({ time: s.time, course: c.name, index, type: s.type })))
      .sort((a, b) => a.time.localeCompare(b.time)),
  })).filter(d => d.items.length > 0);
}
