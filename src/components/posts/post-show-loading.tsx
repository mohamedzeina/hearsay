import { Skeleton } from '@heroui/react';
import SurfacePanel from '@/components/common/surface-panel';

export default function PostShowLoading() {
  return (
    <SurfacePanel size="lg">
      <div className="h-1.5 bg-cream-2" />
      <div className="px-6 sm:px-8 py-7 sm:py-8">
        <Skeleton className="h-6 w-24 rounded-full mb-4 bg-cream-2" />
        <Skeleton className="h-9 w-3/4 rounded mb-3 bg-cream-2" />
        <Skeleton className="h-9 w-1/2 rounded mb-5 bg-cream-2" />
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-6 rounded-full bg-cream-2" />
          <Skeleton className="h-4 w-24 rounded bg-cream-2" />
          <Skeleton className="h-4 w-20 rounded bg-cream-2" />
        </div>
        <div className="h-px bg-rule mb-6" />
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full rounded bg-cream-2" />
          <Skeleton className="h-4 w-full rounded bg-cream-2" />
          <Skeleton className="h-4 w-3/4 rounded bg-cream-2" />
        </div>
      </div>
    </SurfacePanel>
  );
}
