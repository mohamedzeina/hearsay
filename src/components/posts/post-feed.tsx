'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PostWithData } from '@/db/queries/posts';
import PostCardList from './post-card-list';
import PostEmpty from './post-empty';

type View = 'top' | 'new' | 'following';

const VIEW_META: Record<View, { title: string; subtitle: string }> = {
  top: { title: 'Top discussions', subtitle: 'Most upvotes first' },
  new: { title: 'Fresh posts', subtitle: 'Latest first' },
  following: {
    title: 'From topics you follow',
    subtitle: 'Newest first, scoped to your follows',
  },
};

interface PostFeedProps {
  posts: PostWithData[];
  followingPosts?: PostWithData[];
  /** True when the viewer is signed in — gates the Following tab. */
  canFollow?: boolean;
}

export default function PostFeed({
  posts,
  followingPosts = [],
  canFollow = false,
}: PostFeedProps) {
  const [view, setView] = useState<View>('top');

  const sortedAll = useMemo(
    () =>
      [...posts].sort((a, b) => {
        if (view === 'top') return b._count.votes - a._count.votes;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
    [posts, view]
  );

  // The whole-site feed governs the "empty entire site" message; the
  // Following tab handles its own empty state below so we don't push
  // signed-out users into a "follow some topics" CTA.
  if (posts.length === 0 && view !== 'following') {
    return <PostEmpty />;
  }

  const meta = VIEW_META[view];
  const tabs: View[] = canFollow ? ['top', 'new', 'following'] : ['top', 'new'];
  const isFollowing = view === 'following';

  return (
    <div>
      <header className="flex items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-2xl sm:text-[1.7rem] text-ink leading-tight tracking-tight">
            {meta.title}
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">{meta.subtitle}</p>
        </div>
        <div
          role="tablist"
          aria-label="Filter posts"
          className="inline-flex items-center gap-1 rounded-full bg-cream-2 p-1 border border-rule"
        >
          {tabs.map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 motion-reduce:transition-none ${
                view === v
                  ? 'bg-surface text-ink shadow-soft'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              {v === 'top' && (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="m12 2 2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1z" />
                </svg>
              )}
              {v === 'new' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              )}
              {v === 'following' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                  <path d="M20 7 9 18l-5-5" />
                </svg>
              )}
              {v}
            </button>
          ))}
        </div>
      </header>

      {isFollowing ? (
        followingPosts.length === 0 ? (
          <FollowingEmpty />
        ) : (
          <PostCardList posts={followingPosts} resetKey="following" />
        )
      ) : (
        <PostCardList posts={sortedAll} resetKey={view} />
      )}
    </div>
  );
}

function FollowingEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-rule-2 bg-cream-2/30 px-6 py-12 text-center">
      <p className="font-display font-bold text-lg text-ink mb-1">
        Nothing in your follows yet
      </p>
      <p className="text-sm text-ink-2 mb-4 max-w-sm mx-auto leading-relaxed">
        Open a topic page and tap{' '}
        <span className="font-semibold text-ink">Follow</span> to start
        collecting new posts here.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon transition-colors duration-150 motion-reduce:transition-none"
      >
        Browse topics &rarr;
      </Link>
    </div>
  );
}
