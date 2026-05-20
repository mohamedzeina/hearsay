import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { timeAgo, topicTone } from '@/lib/utils';

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns seconds for under a minute', () => {
    const d = new Date('2026-05-21T11:59:30Z'); // 30s ago
    expect(timeAgo(d)).toBe('30s ago');
  });

  it('returns minutes for under an hour', () => {
    const d = new Date('2026-05-21T11:45:00Z'); // 15m ago
    expect(timeAgo(d)).toBe('15m ago');
  });

  it('returns hours for under a day', () => {
    const d = new Date('2026-05-21T09:00:00Z'); // 3h ago
    expect(timeAgo(d)).toBe('3h ago');
  });

  it('returns days for older than a day', () => {
    const d = new Date('2026-05-16T12:00:00Z'); // 5d ago
    expect(timeAgo(d)).toBe('5d ago');
  });

  it('handles "just now" (0 seconds)', () => {
    expect(timeAgo(new Date('2026-05-21T12:00:00Z'))).toBe('0s ago');
  });

  it('crosses to minutes at exactly 60s', () => {
    const d = new Date('2026-05-21T11:59:00Z'); // exactly 60s ago
    expect(timeAgo(d)).toBe('1m ago');
  });

  it('crosses to hours at exactly 60m', () => {
    const d = new Date('2026-05-21T11:00:00Z'); // exactly 60m ago
    expect(timeAgo(d)).toBe('1h ago');
  });

  it('crosses to days at exactly 24h', () => {
    const d = new Date('2026-05-20T12:00:00Z'); // exactly 24h ago
    expect(timeAgo(d)).toBe('1d ago');
  });
});

describe('topicTone', () => {
  it('returns a tone with bg, text, and dot classes', () => {
    const tone = topicTone('javascript');
    expect(tone).toHaveProperty('bg');
    expect(tone).toHaveProperty('text');
    expect(tone).toHaveProperty('dot');
  });

  it('is deterministic for the same slug', () => {
    expect(topicTone('react')).toEqual(topicTone('react'));
    expect(topicTone('cooking')).toEqual(topicTone('cooking'));
  });

  it('distributes across the palette for different slugs', () => {
    const slugs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const tones = slugs.map(topicTone);
    const uniqueBgs = new Set(tones.map((t) => t.bg));
    // Won't necessarily hit all 8, but should hit more than 2.
    expect(uniqueBgs.size).toBeGreaterThan(2);
  });

  it('handles empty string without throwing', () => {
    expect(() => topicTone('')).not.toThrow();
  });

  it('handles unicode slugs', () => {
    expect(() => topicTone('café-discussion')).not.toThrow();
  });
});
