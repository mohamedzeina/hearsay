'use client';

import { Skeleton } from '@heroui/react';

export default function SignInLoading() {
  return (
    <div className="py-10 sm:py-14 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* LEFT: Brand panel skeleton */}
        <section className="lg:col-span-7 space-y-5">
          {/* Welcome eyebrow */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rule-2" />
            <Skeleton className="h-3 w-24 rounded bg-cream-2" />
          </div>

          {/* Oversized hearsay. wordmark */}
          <Skeleton className="h-[clamp(4rem,12vw,9rem)] w-[min(100%,720px)] rounded-lg bg-cream-2" />

          {/* "All opinions welcome. Even yours." subhead */}
          <div className="space-y-2 max-w-xl pt-2">
            <Skeleton className="h-7 w-3/4 rounded bg-cream-2" />
            <Skeleton className="h-7 w-1/2 rounded bg-cream-2" />
          </div>

          {/* Value props 01 / 02 / 03 */}
          <ul className="space-y-5 max-w-lg pt-6">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex gap-4 items-start">
                <Skeleton className="h-3 w-6 rounded bg-cream-2 mt-1.5 shrink-0" />
                <div className="border-l border-rule pl-4 flex-1 space-y-2">
                  <Skeleton className="h-4 w-44 rounded bg-cream-2" />
                  <Skeleton className="h-3 w-full rounded bg-cream-2" />
                  <Skeleton className="h-3 w-2/3 rounded bg-cream-2" />
                </div>
              </li>
            ))}
          </ul>

          {/* Topic chip constellation */}
          <div className="pt-8 space-y-3">
            <Skeleton className="h-3 w-40 rounded bg-cream-2" />
            <div className="flex flex-wrap gap-1.5">
              {[14, 18, 12, 22, 16, 20, 14, 18].map((w, i) => (
                <Skeleton
                  key={i}
                  className="h-6 rounded-full bg-cream-2"
                  style={{ width: `${w * 5}px` }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT: Auth card skeleton */}
        <section className="lg:col-span-5">
          <div className="relative rounded-3xl border border-rule bg-surface shadow-lift overflow-hidden">
            {/* Top accent (actual color, not a skeleton — matches final state) */}
            <div className="h-1.5 bg-persimmon" aria-hidden />

            <div className="px-8 py-9 space-y-4">
              {/* Eyebrow */}
              <Skeleton className="h-3 w-32 rounded bg-cream-2" />

              {/* "Sign in" headline */}
              <Skeleton className="h-9 w-28 rounded bg-cream-2" />

              {/* Description copy */}
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3 w-full rounded bg-cream-2" />
                <Skeleton className="h-3 w-5/6 rounded bg-cream-2" />
                <Skeleton className="h-3 w-3/4 rounded bg-cream-2" />
              </div>

              {/* GitHub button — full pill */}
              <Skeleton className="h-12 w-full rounded-full bg-cream-2 mt-4" />

              {/* "Why only GitHub?" disclosure */}
              <Skeleton className="h-3 w-36 rounded bg-cream-2" />

              {/* Social proof divider + generic block (real count revealed after data loads) */}
              <div className="pt-5 border-t border-rule flex items-center gap-3">
                <Skeleton className="h-8 w-24 rounded-full bg-cream-2 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4 rounded bg-cream-2" />
                  <Skeleton className="h-2.5 w-1/2 rounded bg-cream-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Below-card footnote */}
          <div className="mt-5 flex justify-center">
            <Skeleton className="h-3 w-56 rounded bg-cream-2" />
          </div>
        </section>
      </div>
    </div>
  );
}
