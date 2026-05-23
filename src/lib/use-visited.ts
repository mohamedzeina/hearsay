'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'hearsay:visited';
const EVENT_NAME = 'hearsay:post-visited';
const MAX_VISITED = 200;

function safeGet(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Mark a post as read on the current device. Most-recent-first, dedup'd,
 * capped at MAX_VISITED entries so localStorage stays bounded. Fires a
 * window CustomEvent so any mounted `useVisited` hooks in the same tab
 * re-read immediately; cross-tab sync comes for free via the storage event.
 */
export function markVisited(postId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = safeGet();
    if (current[0] === postId) return; // already at the head, no-op
    const next = [postId, ...current.filter((id) => id !== postId)].slice(
      0,
      MAX_VISITED
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { postId } })
    );
  } catch {
    // Disabled / quota-full storage (Safari private mode) — degrades to
    // session-only visited state. Not worth surfacing.
  }
}

/**
 * Read the set of visited post IDs for the current device. SSR-safe: the
 * initial server-render and first client paint always return an empty Set;
 * the effect rehydrates from localStorage on mount so hydration matches.
 */
export function useVisited(): Set<string> {
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setVisited(new Set(safeGet()));

    const refresh = () => setVisited(new Set(safeGet()));

    window.addEventListener(EVENT_NAME, refresh);
    // Cross-tab: storage event fires only in *other* tabs when one tab
    // writes the same key. Lets a "read on tab A" land on tab B's feed
    // when the user switches back.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return visited;
}

// Exported for tests.
export const VISITED_STORAGE_KEY = STORAGE_KEY;
export const VISITED_EVENT_NAME = EVENT_NAME;
export const VISITED_MAX = MAX_VISITED;
