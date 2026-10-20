'use client';

import { useEffect, useState } from 'react';
import { calc, type Course } from '@/lib/calc';
import type { Extraction } from '@/lib/extract';

const KEY = 'attendance-v2';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Saved = { defaultRate: number; courses: (Course & { name: string })[] };

const toSaved = (x: Extraction, defaultRate: number): Saved => ({
  defaultRate,
  courses: x.courses.map(c => ({
    name: c.name, slots: c.slots, rate: null, mode: 'all',
    start: x.start, classesEnd: x.classesEnd, holidays: x.holidays, missed: [], cancelled: [],
  })),
});

const persist = (s: Saved) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} // blocked storage: keep working in memory
};

const field = 'rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700';
const primary = 'rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black';

export default function Home() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [draft, setDraft] = useState<Extraction | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists after mount; reading in render breaks hydration
      if (raw) setSaved(JSON.parse(raw));
    } catch {} // corrupt or blocked storage: start fresh
  }, []);

  async function extract() {
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      files.forEach(f => body.append('files', f));
      const res = await fetch('/api/extract', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong.');
      setDraft(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!draft) return;
    const next = toSaved(draft, saved?.defaultRate ?? 70);
    persist(next);
    setSaved(next);
    setDraft(null);
    setFiles([]);
  }

  function setRate(rate: number) {
    if (!saved) return;
    const next = { ...saved, defaultRate: rate };
    persist(next);
    setSaved(next);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Attendance tracker</h1>

      {draft ? (
        <Review draft={draft} onChange={setDraft} onSave={save} onCancel={() => setDraft(null)} />
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">{saved ? 'Replace schedule' : 'Upload your schedule and academic calendar'}</h2>
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-zinc-400 p-8 text-center focus-within:ring-2 focus-within:ring-blue-500 hover:border-black dark:border-zinc-500 dark:hover:border-white">
            <span className="text-base font-medium">Tap to choose your files</span>
            <span className="text-sm text-zinc-500">
              {files.length ? files.map(f => f.name).join(', ') : 'Timetable and academic calendar'}
            </span>
            <input
              type="file"
              multiple
              className="sr-only"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={e => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          <p className="text-sm text-zinc-500">PDF, PNG, JPG or WebP, up to 4 MB in total.</p>
          <button className={primary} disabled={busy || files.length === 0} onClick={extract}>
            {busy ? 'Reading files…' : 'Extract'}
          </button>
          {error && <p role="alert" className="text-red-600">{error}</p>}
        </section>
      )}

      {saved && !draft && <Dashboard saved={saved} onRate={setRate} />}
    </main>
  );
}

type ReviewProps = { draft: Extraction; onChange: (x: Extraction) => void; onSave: () => void; onCancel: () => void };

function Review({ draft, onChange, onSave, onCancel }: ReviewProps) {
  const datesOk = draft.start !== '' && draft.classesEnd !== '' && draft.start <= draft.classesEnd;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Check what was found</h2>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col text-sm">
          Classes start
          <input type="date" className={field} value={draft.start} onChange={e => onChange({ ...draft, start: e.target.value })} />
        </label>
        <label className="flex flex-col text-sm">
          Classes end
          <input type="date" className={field} value={draft.classesEnd} onChange={e => onChange({ ...draft, classesEnd: e.target.value })} />
        </label>
      </div>
      {!datesOk && <p className="text-sm text-amber-600">Set valid start and end dates to continue.</p>}

      <div>
        <h3 className="font-medium">Holidays (days off)</h3>
        {draft.holidays.length === 0 && <p className="text-sm text-zinc-500">None found.</p>}
        <ul className="flex flex-col gap-1 text-sm">
          {draft.holidays.map((h, i) => (
            <li key={i} className="flex items-center gap-2">
              {h.from === h.to ? h.from : `${h.from} → ${h.to}`}
              <button className="text-red-600" onClick={() => onChange({ ...draft, holidays: draft.holidays.filter((_, j) => j !== i) })}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-medium">Courses</h3>
        {draft.courses.length === 0 && <p className="text-sm text-zinc-500">No courses found.</p>}
        <ul className="flex flex-col gap-2">
          {draft.courses.map((c, i) => (
            <li key={i} className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <b>{c.name}</b>
                <button className="text-red-600" onClick={() => onChange({ ...draft, courses: draft.courses.filter((_, j) => j !== i) })}>
                  Remove
                </button>
              </div>
              <p className="text-zinc-500">{c.slots.map(s => `${DAYS[s.day]} ${s.time} ${s.type}`).join(' · ') || 'No slots'}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <button className={primary} disabled={!datesOk || draft.courses.length === 0} onClick={onSave}>Save</button>
        <button className="px-4 py-2" onClick={onCancel}>Cancel</button>
      </div>
    </section>
  );
}

function Dashboard({ saved, onRate }: { saved: Saved; onRate: (rate: number) => void }) {
  return (
    <section className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        Required attendance %
        <input
          type="number"
          min={0}
          max={100}
          className={`${field} w-20`}
          value={saved.defaultRate}
          onChange={e => onRate(Math.min(100, Math.max(0, Number(e.target.value))))}
        />
      </label>
      <ul className="flex flex-col gap-2">
        {saved.courses.map((c, i) => {
          const [g] = calc(c, saved.defaultRate);
          return (
            <li key={i} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
              <b>{c.name}</b>
              <p className="text-sm text-zinc-500">
                {g ? `${g.total} sessions · you can miss ${g.allowed} · ${g.left} left` : 'No sessions in this date range'}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
