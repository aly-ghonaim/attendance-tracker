import { describe, expect, it } from 'vitest';
import type { Course } from './calc';
import { pickWeek, weeks, weekStart } from './schedule';
import { uelTerm1 } from './sample';

const courses: Course[] = uelTerm1.courses.map(c => ({
  ...c, rate: null, mode: 'all', start: uelTerm1.start, classesEnd: uelTerm1.classesEnd,
  holidays: uelTerm1.holidays, missed: [], cancelled: [],
}));
const all = weeks(courses);

describe('weekStart', () => {
  it('weeks run Saturday to Friday, like the uni calendar', () => {
    expect(weekStart('2025-09-27')).toBe('2025-09-27'); // Sat
    expect(weekStart('2025-10-06')).toBe('2025-10-04'); // Mon
    expect(weekStart('2025-10-03')).toBe('2025-09-27'); // Fri
  });
});

describe('weeks', () => {
  it('has 12 teaching weeks numbered from 1', () => {
    expect(all).toHaveLength(12);
    expect([all[0].number, all[11].number]).toEqual([1, 12]);
  });
  it('week 1 has Mon-Thu with 12 classes, each day in time order', () => {
    expect(all[0].days.map(d => d.date)).toEqual(['2025-09-29', '2025-09-30', '2025-10-01', '2025-10-02']);
    expect(all[0].days.reduce((n, d) => n + d.items.length, 0)).toBe(12);
    expect(all[0].days[0].items.map(e => e.s.time)).toEqual(['08:30', '10:00', '11:30']);
  });
  it('keeps the holiday Monday in week 2, flagged', () =>
    expect(all[1].days[0].items.every(e => e.s.holiday)).toBe(true));
});

describe('pickWeek', () => {
  it('picks the week containing today, else the nearest end of the term', () => {
    expect(pickWeek(all, '2025-10-08')).toBe(1);
    expect(pickWeek(all, '2025-01-01')).toBe(0);
    expect(pickWeek(all, '2026-10-20')).toBe(11);
  });
});
