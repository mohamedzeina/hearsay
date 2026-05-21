import { Skeleton } from '@heroui/react';
import PostListSkeleton from '@/components/posts/post-list-skeleton';

export default function SavedPostsLoading() {
  return (
    <div className="py-8 sm:py-10">
      <Skeleton className="h-4 w-32 rounded mb-6 bg-cream-2" />

      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-28 rounded bg-cream-2" />
        <Skeleton className="h-9 w-64 rounded bg-cream-2" />
      </div>

      <PostListSkeleton />
    </div>
  );
}
