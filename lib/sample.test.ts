import { describe, expect, it } from 'vitest';
import { calc, type Course } from './calc';
import { parseExtraction } from './extract';
import { uelTerm1 } from './sample';

const asCourse = (i: number): Course => ({
  ...uelTerm1.courses[i], rate: null, mode: 'all', start: uelTerm1.start, classesEnd: uelTerm1.classesEnd,
  holidays: uelTerm1.holidays, missed: [], cancelled: [],
});

describe('uelTerm1 sample', () => {
  it('passes the same validation as AI output', () => expect(parseExtraction(uelTerm1)).toEqual(uelTerm1));
  // 12 teaching weeks, 4 slots a week per course; Mon 6 Oct 2025 is a holiday (Mondays hold 1 DB slot, 2 Cyber slots).
  it('gives hand-counted totals at 70%', () => {
    const [db, mw, cyber] = [0, 1, 2].map(i => calc(asCourse(i), 70)[0]);
    expect([db.total, db.allowed]).toEqual([47, 14]);
    expect([mw.total, mw.allowed]).toEqual([48, 14]);
    expect([cyber.total, cyber.allowed]).toEqual([46, 13]);
  });
});
