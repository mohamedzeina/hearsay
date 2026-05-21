'use client';

import PostShowLoading from '@/components/posts/post-show-loading';
import CommentListLoading from '@/components/comments/comment-list-loading';
import { Skeleton } from '@heroui/react';
import SurfacePanel from '@/components/common/surface-panel';

function SidebarPanelSkeleton({
  title,
  rows = 2,
}: {
  title: string;
  rows?: number;
}) {
  return (
    <SurfacePanel>
      <header className="px-4 py-3 border-b border-rule">
        <h3 className="font-display font-bold text-sm text-ink-3">{title}</h3>
      </header>
      <div className="p-4 space-y-2.5">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-5 rounded bg-cream-2" />
            <Skeleton
              className="h-3 rounded bg-cream-2 flex-1"
              style={{ maxWidth: `${65 + ((i * 13) % 25)}%` }}
            />
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}

export default function PostShowPageLoading() {
  return (
    <div className="py-8 sm:py-10">
      <Skeleton className="h-4 w-48 rounded mb-6 bg-cream-2" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <PostShowLoading />

          <SurfacePanel>
            <header className="px-5 pt-4 pb-3 border-b border-rule flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rule-2" />
              <Skeleton className="h-4 w-40 rounded bg-cream-2" />
            </header>
            <div className="p-5 space-y-3">
              <Skeleton className="h-20 w-full rounded-xl bg-cream-2" />
              <div className="flex justify-end">
                <Skeleton className="h-10 w-32 rounded-full bg-cream-2" />
              </div>
            </div>
          </SurfacePanel>

          <CommentListLoading />
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-5">
            <SurfacePanel>
              <header className="px-4 py-3 border-b border-rule">
                <h3 className="font-display font-bold text-sm text-ink-3">
                  Author
                </h3>
              </header>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full bg-cream-2" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded bg-cream-2" />
                    <Skeleton className="h-3 w-1/2 rounded bg-cream-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Skeleton className="h-14 rounded-xl bg-cream-2" />
                  <Skeleton className="h-14 rounded-xl bg-cream-2" />
                </div>
              </div>
            </SurfacePanel>
            <SidebarPanelSkeleton title="Thread map" rows={3} />
            <SidebarPanelSkeleton title="More in topic" rows={3} />
          </div>
        </aside>
      </div>
    </div>
  );
}
