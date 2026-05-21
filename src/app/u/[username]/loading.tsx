'use client';

import { Skeleton } from '@heroui/react';
import PostListSkeleton from '@/components/posts/post-list-skeleton';

export default function UserProfileLoading() {
  return (
    <div className="py-8 sm:py-10">
      <Skeleton className="h-4 w-40 rounded mb-6 bg-cream-2" />

      <div className="rounded-3xl border border-rule bg-cream-2/60 px-6 sm:px-10 py-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-6">
          <Skeleton className="h-16 w-16 rounded-full bg-cream-2 shrink-0" />
          <div className="space-y-2 min-w-0 flex-1">
            <Skeleton className="h-3 w-32 rounded bg-cream-2" />
            <Skeleton className="h-8 w-56 rounded bg-cream-2" />
            <Skeleton className="h-3 w-24 rounded bg-cream-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-28 rounded-xl bg-cream-2" />
            <Skeleton className="h-16 w-28 rounded-xl bg-cream-2" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8">
          <Skeleton className="h-6 w-32 rounded mb-4 bg-cream-2" />
          <PostListSkeleton />
        </div>
        <aside className="lg:col-span-4">
          <div className="rounded-2xl border border-rule bg-surface p-5 space-y-3">
            <Skeleton className="h-4 w-32 rounded bg-cream-2" />
            <Skeleton className="h-3 w-full rounded bg-cream-2" />
            <Skeleton className="h-3 w-3/4 rounded bg-cream-2" />
            <Skeleton className="h-3 w-full rounded bg-cream-2" />
          </div>
        </aside>
      </div>
    </div>
  );
}
