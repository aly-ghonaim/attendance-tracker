export type Slot = { day: number; time: string; type: string };
export type DateRange = { from: string; to: string };
export type Course = {
  rate: number | null;
  mode: 'all' | 'type';
  start: string;
  classesEnd: string;
  holidays: DateRange[];
  slots: Slot[];
  missed: string[];
  cancelled: string[];
};
export type Session = { date: string; time: string; type: string; key: string; holiday: boolean };
export type Group = { name: string; total: number; missed: number; allowed: number; left: number };

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Every dated session implied by the weekly slots; holiday ones are flagged (a day off, not a cancellation) so the UI can label them.
export function sessions(c: Course): Session[] {
  if (!c.start || !c.classesEnd) return [];
  const out: Session[] = [];
  const [y, m, d] = c.start.split('-').map(Number);
  for (let t = new Date(y, m - 1, d); fmt(t) <= c.classesEnd; t.setDate(t.getDate() + 1)) {
    const date = fmt(t);
    const holiday = c.holidays.some(h => date >= h.from && date <= h.to);
    for (const s of c.slots)
      if (s.day === t.getDay()) out.push({ date, time: s.time, type: s.type, key: `${date}|${s.time}|${s.type}`, holiday });
  }
  return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

// Integer maths on the percent avoids float error (e.g. 1 - 0.7). Missing exactly `allowed` is still OK.
export function calc(c: Course, defaultRate: number): Group[] {
  const pct = c.rate ?? defaultRate;
  const groups: Record<string, Session[]> = {};
  for (const s of sessions(c)) {
    if (s.holiday || c.cancelled.includes(s.key)) continue;
    (groups[c.mode === 'type' ? s.type : 'All sessions'] ??= []).push(s);
  }
  return Object.entries(groups).map(([name, ss]) => {
    const missed = ss.filter(s => c.missed.includes(s.key)).length;
    const allowed = Math.floor((ss.length * (100 - pct)) / 100);
    return { name, total: ss.length, missed, allowed, left: allowed - missed };
  });
}
