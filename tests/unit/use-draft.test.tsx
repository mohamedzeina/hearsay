import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDraft } from '@/lib/use-draft';

const PREFIX = 'hearsay:draft:';

describe('useDraft', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useDraft('comment:p1'));
    expect(result.current.value).toBe('');
  });

  it('hydrates from localStorage on mount', () => {
    window.localStorage.setItem(PREFIX + 'comment:p1', 'half-written reply');
    const { result } = renderHook(() => useDraft('comment:p1'));
    expect(result.current.value).toBe('half-written reply');
  });

  it('persists writes to localStorage under the prefixed key', () => {
    const { result } = renderHook(() => useDraft('comment:p1'));

    act(() => result.current.setValue('typing in progress'));

    expect(window.localStorage.getItem(PREFIX + 'comment:p1')).toBe(
      'typing in progress'
    );
  });

  it('removes the entry rather than storing an empty string', () => {
    window.localStorage.setItem(PREFIX + 'comment:p1', 'previous text');
    const { result } = renderHook(() => useDraft('comment:p1'));

    act(() => result.current.setValue(''));

    expect(window.localStorage.getItem(PREFIX + 'comment:p1')).toBeNull();
  });

  it('clear() empties the value and removes the storage entry', () => {
    window.localStorage.setItem(PREFIX + 'comment:p1', 'old draft');
    const { result } = renderHook(() => useDraft('comment:p1'));

    expect(result.current.value).toBe('old draft');
    act(() => result.current.clear());

    expect(result.current.value).toBe('');
    expect(window.localStorage.getItem(PREFIX + 'comment:p1')).toBeNull();
  });

  it('isolates drafts under different keys', () => {
    window.localStorage.setItem(PREFIX + 'a', 'a-text');
    window.localStorage.setItem(PREFIX + 'b', 'b-text');

    const a = renderHook(() => useDraft('a'));
    const b = renderHook(() => useDraft('b'));

    expect(a.result.current.value).toBe('a-text');
    expect(b.result.current.value).toBe('b-text');
  });

  it('re-hydrates when the key prop changes', () => {
    window.localStorage.setItem(PREFIX + 'k1', 'one');
    window.localStorage.setItem(PREFIX + 'k2', 'two');

    const { result, rerender } = renderHook(({ k }) => useDraft(k), {
      initialProps: { k: 'k1' },
    });
    expect(result.current.value).toBe('one');

    rerender({ k: 'k2' });
    expect(result.current.value).toBe('two');
  });

  it('survives a localStorage that throws on read', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const { result } = renderHook(() => useDraft('comment:p1'));
    expect(result.current.value).toBe('');
  });

  it('survives a localStorage that throws on write', () => {
    const { result } = renderHook(() => useDraft('comment:p1'));
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });

    expect(() =>
      act(() => result.current.setValue('still typing'))
    ).not.toThrow();
    expect(result.current.value).toBe('still typing');
  });
});
