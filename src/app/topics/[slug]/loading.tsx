import { Skeleton } from '@heroui/react';
import PostListSkeleton from '@/components/posts/post-list-skeleton';

export default function TopicShowLoading() {
  return (
    <div className="py-8 sm:py-10">
      <Skeleton className="h-4 w-32 rounded mb-6 bg-cream-2" />

      <div className="rounded-3xl border border-rule bg-cream-2/60 px-6 sm:px-10 py-8 sm:py-10 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full bg-cream-2" />
          <Skeleton className="h-5 w-20 rounded-full bg-cream-2" />
        </div>
        <Skeleton className="h-10 w-48 rounded bg-cream-2" />
        <Skeleton className="h-4 w-2/3 rounded bg-cream-2" />
        <Skeleton className="h-4 w-1/2 rounded bg-cream-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8">
          <Skeleton className="h-8 w-56 rounded mb-5 bg-cream-2" />
          <PostListSkeleton />
        </div>
        <aside className="hidden lg:block lg:col-span-4">
          <div className="rounded-2xl border border-rule bg-surface p-5 space-y-3">
            <Skeleton className="h-4 w-40 rounded bg-cream-2" />
            <Skeleton className="h-3 w-full rounded bg-cream-2" />
            <Skeleton className="h-10 w-full rounded-full bg-cream-2" />
          </div>
        </aside>
      </div>
    </div>
  );
}
