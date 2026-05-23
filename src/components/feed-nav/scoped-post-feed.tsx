'use client';

import Link from 'next/link';
import type { PostWithData } from '@/db/queries/posts';
import PostFeed from '@/components/posts/post-feed';
import paths from '@/paths';
import { useScope } from './scope-provider';

interface ScopedPostFeedProps {
  everywherePosts: PostWithData[];
  followingPosts: PostWithData[];
}

export default function ScopedPostFeed({
  everywherePosts,
  followingPosts,
}: ScopedPostFeedProps) {
  const { scope } = useScope();

  if (scope === 'following') {
    return (
      <PostFeed
        key="following"
        posts={followingPosts}
        defaultSort="new"
        title="From topics you follow"
        subtitle="Scoped to your follows"
        emptyState={<FollowingEmpty />}
      />
    );
  }

  return <PostFeed key="everywhere" posts={everywherePosts} defaultSort="top" />;
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
        href={paths.home()}
        className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon transition-colors duration-150 motion-reduce:transition-none"
      >
        Browse topics &rarr;
      </Link>
    </div>
  );
}
