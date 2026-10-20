import { describe, expect, it } from 'vitest';
import { weekly } from './schedule';
import { uelTerm1 } from './sample';

describe('weekly', () => {
  const days = weekly(uelTerm1.courses);

  it('lists only days that have classes, in the uni week order (Sat first)', () =>
    expect(days.map(d => d.day)).toEqual([1, 2, 3, 4]));
  it('sorts each day by start time and names the course and its index', () =>
    expect(days[0].items).toEqual([
      { time: '08:30', course: 'Cyber Security', index: 2, type: 'lab' },
      { time: '10:00', course: 'Cyber Security', index: 2, type: 'lab' },
      { time: '11:30', course: 'Database Systems', index: 0, type: 'lab' },
    ]));
  it('keeps every weekly slot (12 in total)', () =>
    expect(days.reduce((n, d) => n + d.items.length, 0)).toBe(12));
  it('puts Saturday before Monday', () =>
    expect(weekly([{ name: 'X', slots: [{ day: 1, time: '09:00', type: 'lab' }, { day: 6, time: '09:00', type: 'lab' }] }]).map(d => d.day)).toEqual([6, 1]));
});
