'use client';

import { Skeleton } from '@heroui/react';
import PostListSkeleton from '@/components/posts/post-list-skeleton';

export default function SearchLoading() {
  return (
    <div className="py-8 sm:py-10">
      <div className="mb-7 space-y-2">
        <Skeleton className="h-3 w-32 rounded bg-cream-2" />
        <Skeleton className="h-9 w-2/3 rounded bg-cream-2" />
        <Skeleton className="h-4 w-44 rounded bg-cream-2" />
      </div>
      <PostListSkeleton />
    </div>
  );
}
