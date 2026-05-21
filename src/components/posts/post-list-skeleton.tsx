'use client';

import { Skeleton } from '@heroui/react';

export default function PostListSkeleton() {
  return (
    <ul className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-rule bg-surface p-5 sm:p-6 space-y-3"
        >
          <Skeleton className="h-4 w-20 rounded-full bg-cream-2" />
          <Skeleton className="h-5 w-3/4 rounded bg-cream-2" />
          <Skeleton className="h-3.5 w-full rounded bg-cream-2" />
          <Skeleton className="h-3.5 w-2/3 rounded bg-cream-2" />
          <div className="flex items-center gap-3 pt-1">
            <Skeleton className="h-5 w-5 rounded-full bg-cream-2" />
            <Skeleton className="h-3 w-24 rounded bg-cream-2" />
            <Skeleton className="h-3 w-16 rounded bg-cream-2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
