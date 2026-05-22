'use client';

import { Skeleton } from '@heroui/react';

export default function NotificationsLoading() {
  return (
    <div className="py-8 sm:py-10">
      <Skeleton className="h-4 w-32 rounded mb-6 bg-cream-2" />

      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-28 rounded bg-cream-2" />
        <Skeleton className="h-9 w-56 rounded bg-cream-2" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="rounded-2xl border border-rule bg-surface px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full bg-cream-2 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4 rounded bg-cream-2" />
                <Skeleton className="h-3.5 w-2/3 rounded bg-cream-2" />
                <Skeleton className="h-2.5 w-20 rounded bg-cream-2" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
