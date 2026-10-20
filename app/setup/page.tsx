'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Extraction } from '@/lib/extract';
import { fromExtraction, save, useSaved } from '@/lib/store';
import { card, field, ghostButton, primaryButton } from '../ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dateLabel = (iso: string) =>
  new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Setup() {
  const saved = useSaved();
  const router = useRouter();
  const [draft, setDraft] = useState<Extraction | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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

  function confirm() {
    if (!draft) return;
    save(fromExtraction(draft, saved?.defaultRate ?? 70));
    router.push('/');
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 p-4 pb-12">
      <header className="flex items-center gap-2 pt-2">
        <Link href="/" aria-label="Back to courses" className="flex size-11 items-center justify-center rounded-full text-xl hover:bg-black/5 dark:hover:bg-white/10">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{draft ? 'Check what we found' : saved ? 'Replace schedule' : 'Upload your schedule'}</h1>
      </header>

      {draft ? (
        <Review draft={draft} onChange={setDraft} onConfirm={confirm} onCancel={() => setDraft(null)} />
      ) : (
        <section className="flex flex-col gap-4">
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-400 bg-white p-6 text-center focus-within:ring-2 focus-within:ring-blue-500 hover:border-blue-600 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-blue-400">
            <span className="text-lg font-medium">Tap to choose your files</span>
            <span className="break-all text-sm text-zinc-500">
              {files.length ? files.map(f => f.name).join(', ') : 'Your timetable and your academic calendar'}
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
          {saved && <p className="text-sm text-amber-700 dark:text-amber-400">Replacing your schedule clears the classes you marked as missed.</p>}
          <button className={primaryButton} disabled={busy || files.length === 0} onClick={extract}>
            {busy ? 'Reading your files…' : 'Extract'}
          </button>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
        </section>
      )}
    </main>
  );
}

type ReviewProps = { draft: Extraction; onChange: (x: Extraction) => void; onConfirm: () => void; onCancel: () => void };

function Review({ draft, onChange, onConfirm, onCancel }: ReviewProps) {
  const datesOk = draft.start !== '' && draft.classesEnd !== '' && draft.start <= draft.classesEnd;
  return (
    <section className="flex flex-col gap-5">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">The AI can misread small text. Compare this with your timetable before saving.</p>

      <div className={`${card} flex flex-col gap-3`}>
        <h2 className="font-medium">Term dates</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Classes start
            <input type="date" className={field} value={draft.start} onChange={e => onChange({ ...draft, start: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Classes end
            <input type="date" className={field} value={draft.classesEnd} onChange={e => onChange({ ...draft, classesEnd: e.target.value })} />
          </label>
        </div>
        {!datesOk && <p className="text-sm text-amber-700 dark:text-amber-400">Set a start date that is before the end date.</p>}
      </div>

      <div className={`${card} flex flex-col gap-2`}>
        <h2 className="font-medium">Holidays (days off)</h2>
        {draft.holidays.length === 0 && <p className="text-sm text-zinc-500">None found.</p>}
        <ul className="flex flex-col">
          {draft.holidays.map((h, i) => (
            <li key={i} className="flex min-h-11 items-center justify-between gap-2 border-t border-zinc-100 text-sm first:border-t-0 dark:border-zinc-800">
              {h.from === h.to ? dateLabel(h.from) : `${dateLabel(h.from)} – ${dateLabel(h.to)}`}
              <button
                className="min-h-11 px-2 text-red-600 dark:text-red-400"
                onClick={() => onChange({ ...draft, holidays: draft.holidays.filter((_, j) => j !== i) })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${card} flex flex-col gap-2`}>
        <h2 className="font-medium">Courses</h2>
        {draft.courses.length === 0 && <p className="text-sm text-zinc-500">No courses found.</p>}
        <ul className="flex flex-col">
          {draft.courses.map((c, i) => (
            <li key={i} className="flex flex-col gap-1 border-t border-zinc-100 py-2 first:border-t-0 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-2">
                <b>{c.name}</b>
                <button
                  className="min-h-11 px-2 text-sm text-red-600 dark:text-red-400"
                  onClick={() => onChange({ ...draft, courses: draft.courses.filter((_, j) => j !== i) })}
                >
                  Remove
                </button>
              </div>
              <p className="text-sm text-zinc-500">{c.slots.map(s => `${DAYS[s.day]} ${s.time} ${s.type}`).join(' · ') || 'No weekly slots'}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <button className={`${primaryButton} flex-1`} disabled={!datesOk || draft.courses.length === 0} onClick={onConfirm}>
          Save schedule
        </button>
        <button className={ghostButton} onClick={onCancel}>
          Back
        </button>
      </div>
    </section>
  );
}
