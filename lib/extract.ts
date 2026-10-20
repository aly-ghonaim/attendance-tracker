import type { DateRange, Slot } from './calc';

export type Extraction = {
  start: string;
  classesEnd: string;
  holidays: DateRange[];
  courses: { name: string; slots: Slot[] }[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

const fail = (what: string): never => {
  throw new Error(`Invalid extraction: ${what}`);
};
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
// Gemini returns "" when the files don't say; the review screen lets the user fill it in.
const date = (v: unknown, allowEmpty = false) =>
  typeof v === 'string' && (DATE.test(v) || (allowEmpty && v === '')) ? v : fail(`date ${JSON.stringify(v)}`);

// Model output is untrusted: validate every field before it reaches calc.
export function parseExtraction(raw: unknown): Extraction {
  if (!isObj(raw) || !Array.isArray(raw.holidays) || !Array.isArray(raw.courses)) return fail('shape');
  return {
    start: date(raw.start, true),
    classesEnd: date(raw.classesEnd, true),
    holidays: raw.holidays.map(h => (isObj(h) ? { from: date(h.from), to: date(h.to) } : fail('holiday'))),
    courses: raw.courses.map(c => {
      if (!isObj(c) || typeof c.name !== 'string' || !c.name.trim() || !Array.isArray(c.slots)) return fail('course name');
      return {
        name: c.name.trim(),
        slots: c.slots.map((s): Slot => {
          if (!isObj(s)) return fail('slot');
          if (!Number.isInteger(s.day) || (s.day as number) < 0 || (s.day as number) > 6) fail(`day ${s.day}`);
          if (typeof s.time !== 'string' || !TIME.test(s.time)) fail(`time ${JSON.stringify(s.time)}`);
          if (typeof s.type !== 'string' || !s.type.trim()) fail('slot type');
          return { day: s.day as number, time: s.time as string, type: (s.type as string).trim() };
        }),
      };
    }),
  };
}
