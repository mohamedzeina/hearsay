'use client';

import { useMemo, useState } from 'react';
import type { PostWithData } from '@/db/queries/posts';
import PostCardList from './post-card-list';
import PostEmpty from './post-empty';

type Sort = 'top' | 'new';

interface PostFeedProps {
  posts: PostWithData[];
  /** Initial sort. Defaults to 'top'. The page picks per-scope (e.g. Following defaults to 'new'). */
  defaultSort?: Sort;
  /** Heading shown above the sort pills. Falls back to a sort-derived label. */
  title?: string;
  /** Subtitle shown beneath the heading. Falls back to a sort-derived label. */
  subtitle?: string;
  /** Custom empty state. Falls back to the all-site PostEmpty card. */
  emptyState?: React.ReactNode;
}

const SORT_META: Record<Sort, { title: string; subtitle: string }> = {
  top: { title: 'Top discussions', subtitle: 'Most upvotes first' },
  new: { title: 'Fresh posts', subtitle: 'Latest first' },
};

export default function PostFeed({
  posts,
  defaultSort = 'top',
  title,
  subtitle,
  emptyState,
}: PostFeedProps) {
  const [sort, setSort] = useState<Sort>(defaultSort);

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => {
        if (sort === 'top') return b._count.votes - a._count.votes;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
    [posts, sort]
  );

  if (posts.length === 0) {
    return emptyState ?? <PostEmpty />;
  }

  const meta = SORT_META[sort];
  const resolvedTitle = title ?? meta.title;
  const resolvedSubtitle = subtitle ?? meta.subtitle;

  return (
    <div>
      <header className="flex items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-2xl sm:text-[1.7rem] text-ink leading-tight tracking-tight">
            {resolvedTitle}
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">{resolvedSubtitle}</p>
        </div>
        <div
          role="tablist"
          aria-label="Sort posts"
          className="inline-flex items-center gap-1 rounded-full bg-cream-2 p-1 border border-rule"
        >
          {(['top', 'new'] as Sort[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={sort === s}
              onClick={() => setSort(s)}
              className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 motion-reduce:transition-none ${
                sort === s
                  ? 'bg-surface text-ink shadow-soft'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              {s === 'top' ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="m12 2 2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              )}
              {s}
            </button>
          ))}
        </div>
      </header>

      <PostCardList posts={sorted} resetKey={sort} />
    </div>
  );
}
