'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PostWithData } from '@/db/queries/posts';
import { IconBookmark } from '@/components/icons';
import PostCardList from '@/components/posts/post-card-list';
import { SavedListProvider } from '@/components/posts/saved-list-context';

interface SavedPostsListProps {
  initialPosts: PostWithData[];
}

/**
 * Owns the /saved page body so unsaving a post drops its card immediately
 * (mirroring Twitter/Reddit). Renders both the populated list and the empty
 * state so the page header stays in sync as the count changes.
 *
 * Tombstones the removed post (object + original index) so the bookmark
 * toast's Undo can put it back in the same frame the server re-save kicks
 * off — the provider stays mounted even when the list empties so an undo
 * from the last-unsave still has somewhere to call back into.
 */
export default function SavedPostsList({ initialPosts }: SavedPostsListProps) {
  const [posts, setPosts] = useState(initialPosts);
  // Mirror posts into a ref so removePost can compute the tombstone without
  // putting a side effect inside a setState updater (strict-mode-safe).
  const postsRef = useRef(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const tombstones = useRef(
    new Map<string, { post: PostWithData; index: number }>()
  );

  const removePost = useCallback((postId: string) => {
    const current = postsRef.current;
    const index = current.findIndex((p) => p.id === postId);
    if (index === -1) return;
    tombstones.current.set(postId, { post: current[index], index });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const restorePost = useCallback((postId: string) => {
    const tomb = tombstones.current.get(postId);
    if (!tomb) return;
    tombstones.current.delete(postId);
    setPosts((prev) => {
      if (prev.some((p) => p.id === postId)) return prev;
      const next = [...prev];
      next.splice(Math.min(tomb.index, next.length), 0, tomb.post);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ removePost, restorePost }),
    [removePost, restorePost]
  );

  return (
    <SavedListProvider value={value}>
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
        <PostCardList posts={posts} />
      )}
    </SavedListProvider>
  );
}
