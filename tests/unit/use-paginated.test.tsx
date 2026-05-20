import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePaginated } from '@/lib/use-paginated';

describe('usePaginated', () => {
  it('paginates items by pageSize, starting on page 1', () => {
    const items = Array.from({ length: 12 }, (_, i) => i);
    const { result } = renderHook(() => usePaginated(items, 5));

    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginated).toEqual([0, 1, 2, 3, 4]);
  });

  it('returns the correct slice when moving to a later page', () => {
    const items = Array.from({ length: 12 }, (_, i) => i);
    const { result } = renderHook(() => usePaginated(items, 5));

    act(() => result.current.setPage(2));
    expect(result.current.paginated).toEqual([5, 6, 7, 8, 9]);

    act(() => result.current.setPage(3));
    expect(result.current.paginated).toEqual([10, 11]);
  });

  it('uses default pageSize of 5 when not provided', () => {
    const items = Array.from({ length: 7 }, (_, i) => i);
    const { result } = renderHook(() => usePaginated(items));

    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginated).toHaveLength(5);
  });

  it('totalPages is at least 1 for empty arrays', () => {
    const { result } = renderHook(() => usePaginated<number>([], 5));

    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginated).toEqual([]);
  });

  it('updates pagination when items change', () => {
    const { result, rerender } = renderHook(
      ({ items }) => usePaginated(items, 5),
      { initialProps: { items: [1, 2, 3] } }
    );
    expect(result.current.paginated).toEqual([1, 2, 3]);

    rerender({ items: [10, 20, 30, 40, 50, 60] });
    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginated).toEqual([10, 20, 30, 40, 50]);
  });

  it('handles pageSize larger than items length', () => {
    const items = [1, 2, 3];
    const { result } = renderHook(() => usePaginated(items, 10));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginated).toEqual([1, 2, 3]);
  });
});
