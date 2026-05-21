'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import type { PostWithData } from '@/db/queries/posts';
import { IconBookmark } from '@/components/icons';
import PostCard from '@/components/posts/post-card';
import { SavedListProvider } from '@/components/posts/saved-list-context';

interface SavedPostsListProps {
  initialPosts: PostWithData[];
}

/**
 * Owns the /saved page body so unsaving a post drops its card immediately
 * (mirroring Twitter/Reddit). Renders both the populated list and the empty
 * state so the page header stays in sync as the count changes.
 */
export default function SavedPostsList({ initialPosts }: SavedPostsListProps) {
  const [posts, setPosts] = useState(initialPosts);

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const value = useMemo(() => ({ removePost }), [removePost]);

  return (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
            your bookmarks
          </p>
          <h1 className="mt-1 font-display font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">
            Saved posts
          </h1>
        </div>
        {posts.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2">
            Newest save first
          </span>
        )}
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rule-2 bg-cream-2/30 px-6 py-14 text-center">
          <IconBookmark
            className="w-8 h-8 mx-auto text-ink-3 mb-3"
            aria-hidden
          />
          <p className="font-display font-bold text-lg text-ink mb-1">
            Nothing saved yet
          </p>
          <p className="text-sm text-ink-2 mb-4 max-w-sm mx-auto">
            Tap the bookmark on any post and it&rsquo;ll land here, in
            the order you saved them.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon transition-colors duration-150 motion-reduce:transition-none"
          >
            Browse posts &rarr;
          </Link>
        </div>
      ) : (
        <SavedListProvider value={value}>
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </SavedListProvider>
      )}
    </>
  );
}
