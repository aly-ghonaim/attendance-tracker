'use client';

import { useSyncExternalStore } from 'react';
import type { Course } from './calc';
import type { Extraction } from './extract';

export type SavedCourse = Course & { name: string };
export type Saved = { defaultRate: number; courses: SavedCourse[] };

const KEY = 'attendance-v2';
const listeners = new Set<() => void>();
let state: Saved | null | undefined; // undefined = storage not read yet

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : null;
  } catch {
    state = null; // corrupt or blocked storage: start fresh
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    load();
    onChange();
  };
  listeners.add(onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot() {
  if (state === undefined) load();
  return state;
}

/** undefined while loading (also during server render), null when nothing is saved. */
export const useSaved = (): Saved | null | undefined => useSyncExternalStore(subscribe, getSnapshot, () => undefined);

export function save(next: Saved) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {} // blocked storage: keep working in memory
  listeners.forEach(l => l());
}

export const updateCourse = (saved: Saved, index: number, patch: (c: SavedCourse) => SavedCourse) =>
  save({ ...saved, courses: saved.courses.map((c, i) => (i === index ? patch(c) : c)) });

export const fromExtraction = (x: Extraction, defaultRate: number): Saved => ({
  defaultRate,
  courses: x.courses.map(c => ({
    name: c.name, slots: c.slots, rate: null, mode: 'all',
    start: x.start, classesEnd: x.classesEnd, holidays: x.holidays, missed: [], cancelled: [],
  })),
});
