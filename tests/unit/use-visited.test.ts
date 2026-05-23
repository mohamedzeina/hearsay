import { describe, expect, it, beforeEach } from 'vitest';
import {
  markVisited,
  VISITED_MAX,
  VISITED_STORAGE_KEY,
} from '@/lib/use-visited';

function readRaw(): string[] {
  const raw = localStorage.getItem(VISITED_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

describe('markVisited', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes a single post id under the visited key', () => {
    markVisited('p1');
    expect(readRaw()).toEqual(['p1']);
  });

  it('puts the most-recently-visited id at the head', () => {
    markVisited('p1');
    markVisited('p2');
    markVisited('p3');
    expect(readRaw()).toEqual(['p3', 'p2', 'p1']);
  });

  it('dedupes — revisiting a post promotes it to the head, no duplicates', () => {
    markVisited('p1');
    markVisited('p2');
    markVisited('p3');
    markVisited('p1');
    expect(readRaw()).toEqual(['p1', 'p3', 'p2']);
  });

  it('no-ops when the id is already at the head (no extra write)', () => {
    markVisited('p1');
    const before = localStorage.getItem(VISITED_STORAGE_KEY);
    markVisited('p1');
    const after = localStorage.getItem(VISITED_STORAGE_KEY);
    expect(after).toBe(before);
  });

  it('caps the list at VISITED_MAX entries (oldest evicted)', () => {
    for (let i = 0; i < VISITED_MAX + 5; i++) markVisited(`p${i}`);
    const stored = readRaw();
    expect(stored.length).toBe(VISITED_MAX);
    // Newest is at the head; the very-first entries were dropped.
    expect(stored[0]).toBe(`p${VISITED_MAX + 4}`);
    expect(stored).not.toContain('p0');
    expect(stored).not.toContain('p4');
  });

  it('survives disabled localStorage (try/catch swallowed)', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
    try {
      expect(() => markVisited('p1')).not.toThrow();
    } finally {
      Storage.prototype.setItem = orig;
    }
  });

  it('tolerates corrupt JSON in storage (treats as empty)', () => {
    localStorage.setItem(VISITED_STORAGE_KEY, '{not valid json');
    markVisited('p1');
    expect(readRaw()).toEqual(['p1']);
  });
});
