'use client';

import { Skeleton } from '@heroui/react';
import PostListSkeleton from '@/components/posts/post-list-skeleton';

// Client-side skeleton chrome for the home page. Lives in its own
// 'use client' file because HeroUI's `Skeleton` uses React Context
// internally, which Turbopack refuses to compile from a server
// component. The parent `loading.tsx` stays a server component so it
// can `await auth()` and decide which of the two skeleton variants to
// render via the `isAuthed` prop here.

interface HomeLoadingSkeletonProps {
  isAuthed: boolean;
}

export default function HomeLoadingSkeleton({
  isAuthed,
}: HomeLoadingSkeletonProps) {
  return (
    <div className="py-8 sm:py-10">
      {isAuthed ? <SignedInGreetingSkeleton /> : <SignedOutHeroSkeleton />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
        <div className="lg:col-span-8">
          {/* Mobile scope strip — only signed-in viewers get one. */}
          {isAuthed && <FeedNavMobileSkeleton />}

          {/* Feed header: title block on the left, sort pills on the right. */}
          <div className="flex items-end justify-between gap-4 mb-5">
            <div className="space-y-1.5 min-w-0">
              <Skeleton className="h-7 w-48 rounded bg-cream-2" />
              <Skeleton className="h-3.5 w-32 rounded bg-cream-2" />
            </div>
            <Skeleton className="h-10 w-[136px] rounded-full bg-cream-2 shrink-0" />
          </div>

          <PostListSkeleton />
        </div>

        <aside className="lg:col-span-4 space-y-5">
          {/* "Your feed" scope nav — only shown to signed-in viewers. */}
          {isAuthed && <FeedNavSkeleton />}

          {/* Start something */}
          <div className="rounded-2xl border border-rule bg-surface p-4 space-y-3">
            <Skeleton className="h-4 w-32 rounded bg-cream-2" />
            <Skeleton className="h-10 w-full rounded-full bg-cream-2" />
          </div>

          {/* Browse topics */}
          <div className="rounded-2xl border border-rule bg-surface p-4 space-y-3">
            <Skeleton className="h-4 w-28 rounded bg-cream-2" />
            <div className="flex flex-wrap gap-2 pt-1">
              {[16, 20, 14, 18, 22].map((w, i) => (
                <Skeleton
                  key={i}
                  className="h-6 rounded-full bg-cream-2"
                  style={{ width: `${w * 4}px` }}
                />
              ))}
            </div>
          </div>

          {/* House rules — matches the cream-2 inline note, not a card. */}
          <div className="rounded-2xl bg-cream-2/60 border border-rule px-4 py-3.5 space-y-2">
            <Skeleton className="h-2.5 w-20 rounded bg-cream-2" />
            <Skeleton className="h-3.5 w-full rounded bg-cream-2" />
            <Skeleton className="h-3.5 w-3/4 rounded bg-cream-2" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function FeedNavMobileSkeleton() {
  return (
    <div
      aria-hidden
      className="lg:hidden mb-4 inline-flex items-center gap-1 rounded-full bg-cream-2 p-1 border border-rule"
    >
      <Skeleton className="h-8 w-24 rounded-full bg-surface" />
      <Skeleton className="h-8 w-20 rounded-full bg-cream-2" />
    </div>
  );
}

function FeedNavSkeleton() {
  return (
    <div className="rounded-2xl border border-rule bg-surface shadow-soft overflow-hidden">
      <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
        <Skeleton className="h-4 w-20 rounded bg-cream-2" />
        <Skeleton className="h-3 w-10 rounded bg-cream-2" />
      </div>
      <hr className="border-0 h-px bg-rule" />
      <div className="p-1.5 space-y-0.5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
          >
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28 rounded bg-cream-2" />
              <Skeleton className="h-2.5 w-20 rounded bg-cream-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignedOutHeroSkeleton() {
  return (
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
          <div
            key={i}
            className="px-6 py-5 flex items-baseline justify-between"
          >
            <Skeleton className="h-3 w-12 rounded bg-cream-2" />
            <Skeleton className="h-7 w-10 rounded bg-cream-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SignedInGreetingSkeleton() {
  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rule bg-surface px-5 sm:px-6 py-4 shadow-soft">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-24 rounded bg-cream-2" />
        <Skeleton className="h-7 w-56 rounded bg-cream-2" />
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Skeleton className="h-7 w-16 rounded-full bg-cream-2" />
        <Skeleton className="h-7 w-16 rounded-full bg-cream-2" />
        <Skeleton className="hidden sm:block h-7 w-20 rounded-full bg-cream-2" />
      </div>
    </section>
  );
}
