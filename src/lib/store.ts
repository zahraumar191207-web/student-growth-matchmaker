import { useSyncExternalStore } from "react";

import { EMPTY_PROFILE, type StudentProfile } from "./matching";

/** Tiny localStorage-backed store. Server render uses the initial value, then the client syncs. */
function createPersistentStore<T>(key: string, initial: T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (cache !== undefined) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? ({ ...initialShape(initial), ...JSON.parse(raw) } as T) : initial;
    } catch {
      cache = initial;
    }
    return cache;
  };

  const set = (next: T | ((prev: T) => T)) => {
    const value = typeof next === "function" ? (next as (p: T) => T)(read()) : next;
    cache = value;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked — keep in memory */
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  const useValue = () => useSyncExternalStore(subscribe, read, () => initial);

  return { useValue, set, get: read };
}

function initialShape<T>(initial: T) {
  return Array.isArray(initial) ? {} : (initial as object);
}

export const profileStore = createPersistentStore<StudentProfile & { hasMatched: boolean }>(
  "om.profile.v1",
  { ...EMPTY_PROFILE, hasMatched: false },
);

export type SavedStatus = "interested" | "applying" | "submitted";
export interface SavedItem {
  id: string;
  status: SavedStatus;
  savedAt: number;
}

export const SAVED_STATUS_META: Record<SavedStatus, { label: string }> = {
  interested: { label: "Interested" },
  applying: { label: "Drafting" },
  submitted: { label: "Submitted" },
};

export const savedStore = createPersistentStore<{ items: SavedItem[] }>("om.saved.v1", {
  items: [],
});

export function toggleSaved(id: string) {
  savedStore.set((s) =>
    s.items.some((i) => i.id === id)
      ? { items: s.items.filter((i) => i.id !== id) }
      : { items: [...s.items, { id, status: "interested", savedAt: Date.now() }] },
  );
}

export function setSavedStatus(id: string, status: SavedStatus) {
  savedStore.set((s) => ({
    items: s.items.map((i) => (i.id === id ? { ...i, status } : i)),
  }));
}

export function useIsSaved(id: string) {
  return savedStore.useValue().items.some((i) => i.id === id);
}

/** Anonymous 👍/👎 ratings on recommendations, kept on this device only. */
export type Vote = 1 | -1;
export const feedbackStore = createPersistentStore<{ votes: Record<string, Vote> }>(
  "om.feedback.v1",
  { votes: {} },
);

export function setVote(id: string, vote: Vote) {
  feedbackStore.set((s) => {
    const votes = { ...s.votes };
    if (votes[id] === vote) delete votes[id];
    else votes[id] = vote;
    return { votes };
  });
}
