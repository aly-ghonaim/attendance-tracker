import { describe, expect, it } from 'vitest';
import { parseExtraction } from './extract';

const good = {
  start: '2026-01-05', classesEnd: '2026-04-12',
  holidays: [{ from: '2026-03-01', to: '2026-03-05' }],
  courses: [{ name: 'Calculus', slots: [{ day: 1, time: '09:00', type: 'lecture' }] }],
};

describe('parseExtraction', () => {
  it('accepts a well-formed extraction', () => expect(parseExtraction(good)).toEqual(good));
  it('allows unknown term dates as empty strings so the user can fill them in', () =>
    expect(parseExtraction({ ...good, start: '', classesEnd: '' })).toMatchObject({ start: '', classesEnd: '' }));
  it('rejects non-objects', () => expect(() => parseExtraction('nope')).toThrow());
  it('rejects a weekday outside 0-6', () =>
    expect(() => parseExtraction({ ...good, courses: [{ name: 'X', slots: [{ day: 7, time: '09:00', type: 'lecture' }] }] })).toThrow(/day/));
  it('rejects a malformed time', () =>
    expect(() => parseExtraction({ ...good, courses: [{ name: 'X', slots: [{ day: 1, time: '9am', type: 'lecture' }] }] })).toThrow(/time/));
  it('rejects a malformed holiday date', () =>
    expect(() => parseExtraction({ ...good, holidays: [{ from: 'March 1', to: '2026-03-05' }] })).toThrow(/date/));
  it('rejects a course with no name', () =>
    expect(() => parseExtraction({ ...good, courses: [{ name: '', slots: [] }] })).toThrow(/name/));
});
