import { Skeleton } from '@heroui/react';

function CommentSkeleton({ indent = false }: { indent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-rule bg-surface p-4 ${
        indent ? 'ml-6' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 bg-cream-2" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-3 w-24 rounded bg-cream-2" />
            <Skeleton className="h-3 w-14 rounded bg-cream-2" />
          </div>
          <Skeleton className="h-4 w-full rounded bg-cream-2" />
          <Skeleton className="h-4 w-3/4 rounded bg-cream-2" />
        </div>
      </div>
    </div>
  );
}

export default function CommentListLoading() {
  return (
    <section>
      <Skeleton className="h-6 w-32 rounded mb-4 bg-cream-2" />
      <div className="space-y-3">
        <CommentSkeleton />
        <CommentSkeleton indent />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    </section>
  );
}
