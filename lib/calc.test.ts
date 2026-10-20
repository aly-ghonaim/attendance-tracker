import { describe, expect, it } from 'vitest';
import { attendance, calc, sessions, status, toggle, type Course } from './calc';

// 14 weeks Mon 2026-01-05 .. Sun 2026-04-12, lecture Mon + lab Wed
const base: Course = {
  rate: null, mode: 'all', start: '2026-01-05', classesEnd: '2026-04-12',
  holidays: [], missed: [], cancelled: [],
  slots: [{ day: 1, time: '09:00', type: 'lecture' }, { day: 3, time: '09:00', type: 'lab' }],
};

describe('sessions', () => {
  it('generates one session per slot per week', () => expect(sessions(base)).toHaveLength(28));
  it('returns nothing when dates are missing', () => expect(sessions({ ...base, start: '' })).toEqual([]));
  it('stops after classesEnd (inclusive)', () =>
    expect(sessions({ ...base, classesEnd: '2026-01-07' }).map(s => s.key))
      .toEqual(['2026-01-05|09:00|lecture', '2026-01-07|09:00|lab']));
  it('flags sessions in holiday ranges (both ends inclusive) instead of dropping them', () => {
    const all = sessions({ ...base, holidays: [{ from: '2026-01-05', to: '2026-01-11' }] });
    expect(all).toHaveLength(28);
    expect(all.filter(s => s.holiday).map(s => s.date)).toEqual(['2026-01-05', '2026-01-07']);
  });
});

describe('calc', () => {
  it('combined: 28 sessions at 70% -> 8 allowed', () =>
    expect(calc(base, 70)).toEqual([{ name: 'All sessions', total: 28, missed: 0, allowed: 8, left: 8 }]));
  it('cancelled session leaves the total', () =>
    expect(calc({ ...base, cancelled: ['2026-01-05|09:00|lecture'] }, 70)[0]).toMatchObject({ total: 27, allowed: 8 }));
  it('separate mode: each type counted on its own', () => {
    const g = calc({ ...base, mode: 'type' }, 70);
    expect(g).toHaveLength(2);
    expect(g.every(x => x.total === 14 && x.allowed === 4)).toBe(true);
  });
  it('holidays are days off: left out of total and allowed misses', () =>
    expect(calc({ ...base, holidays: [{ from: '2026-01-05', to: '2026-02-01' }] }, 70)[0]).toMatchObject({ total: 20, allowed: 6 }));
  it('course rate overrides the default; 100% allows none', () =>
    expect(calc({ ...base, rate: 100 }, 70)[0].allowed).toBe(0));
  it('missing exactly the limit is allowed, one more is barred', () => {
    const keys = sessions(base).map(s => s.key);
    expect(calc({ ...base, missed: keys.slice(0, 8) }, 70)[0].left).toBe(0);
    expect(calc({ ...base, missed: keys.slice(0, 9) }, 70)[0].left).toBe(-1);
  });
  it('ignores missed sessions that were cancelled', () => {
    const [k] = sessions(base).map(s => s.key);
    expect(calc({ ...base, cancelled: [k], missed: [k] }, 70)[0].missed).toBe(0);
  });
});

describe('status', () => {
  it('is safe with 2+ misses left, warning at 1 or 0, barred below 0', () => {
    expect([status(5), status(2), status(1), status(0), status(-1)]).toEqual(['safe', 'safe', 'warning', 'warning', 'barred']);
  });
});

describe('toggle', () => {
  it('adds a missing key and removes a present one without mutating', () => {
    const list = ['a'];
    expect(toggle(list, 'b')).toEqual(['a', 'b']);
    expect(toggle(list, 'a')).toEqual([]);
    expect(list).toEqual(['a']);
  });
});

describe('attendance', () => {
  // base: Mon lecture + Wed lab from 2026-01-05; by Mon 2026-01-12 three classes have happened (5, 7, 12 Jan).
  const today = '2026-01-12';
  it('counts classes held so far, not future ones', () => expect(attendance([base], today)).toEqual({ held: 3, attended: 3 }));
  it('subtracts missed classes that have happened', () =>
    expect(attendance([{ ...base, missed: ['2026-01-07|09:00|lab'] }], today)).toEqual({ held: 3, attended: 2 }));
  it('ignores a miss marked on a future class', () =>
    expect(attendance([{ ...base, missed: ['2026-01-14|09:00|lab'] }], today)).toEqual({ held: 3, attended: 3 }));
  it('leaves cancelled classes out of both numbers', () =>
    expect(attendance([{ ...base, cancelled: ['2026-01-05|09:00|lecture'], missed: ['2026-01-05|09:00|lecture'] }], today)).toEqual({ held: 2, attended: 2 }));
  it('leaves holidays out', () =>
    expect(attendance([{ ...base, holidays: [{ from: '2026-01-05', to: '2026-01-11' }] }], today)).toEqual({ held: 1, attended: 1 }));
  it('adds up several courses', () => expect(attendance([base, base], today)).toEqual({ held: 6, attended: 6 }));
  it('is 0 of 0 before the term starts', () => expect(attendance([base], '2025-12-01')).toEqual({ held: 0, attended: 0 }));
});
