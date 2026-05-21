'use client';

import { Skeleton } from '@heroui/react';
import PostListSkeleton from '@/components/posts/post-list-skeleton';

export default function HomeLoading() {
  return (
    <div className="py-8 sm:py-10">
      {/* Hero placeholder */}
      <div className="relative overflow-hidden rounded-3xl border border-rule bg-surface shadow-soft">
        <div className="px-6 sm:px-10 py-10 sm:py-14 space-y-5">
          <Skeleton className="h-6 w-40 rounded-full bg-cream-2" />
          <Skeleton className="h-12 w-3/4 rounded bg-cream-2" />
          <Skeleton className="h-12 w-1/2 rounded bg-cream-2" />
          <Skeleton className="h-4 w-2/3 rounded bg-cream-2" />
          <Skeleton className="h-4 w-1/2 rounded bg-cream-2" />
          <div className="flex items-center gap-3 pt-2">
            <Skeleton className="h-11 w-40 rounded-full bg-cream-2" />
            <Skeleton className="h-11 w-36 rounded-full bg-cream-2" />
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-rule bg-cream-2/40 divide-x divide-rule">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-6 py-5 flex items-baseline justify-between">
              <Skeleton className="h-3 w-12 rounded bg-cream-2" />
              <Skeleton className="h-7 w-10 rounded bg-cream-2" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
        <div className="lg:col-span-8">
          <Skeleton className="h-8 w-56 rounded mb-5 bg-cream-2" />
          <PostListSkeleton />
        </div>
        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-2xl border border-rule bg-surface p-4 space-y-3">
            <Skeleton className="h-4 w-32 rounded bg-cream-2" />
            <Skeleton className="h-10 w-full rounded-full bg-cream-2" />
          </div>
          <div className="rounded-2xl border border-rule bg-surface p-4 space-y-3">
            <Skeleton className="h-4 w-28 rounded bg-cream-2" />
            <div className="flex flex-wrap gap-2 pt-1">
              {[16, 20, 14, 18, 22].map((w, i) => (
                <Skeleton key={i} className={`h-6 rounded-full bg-cream-2 w-${w}`} style={{ width: `${w * 4}px` }} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
