import { useMemo, useState } from 'react';

export function usePaginated<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginated = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );
  return { page, setPage, totalPages, paginated };
}
