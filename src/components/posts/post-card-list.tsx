'use client';

import { useEffect } from 'react';
import type { PostWithData } from '@/db/queries/posts';
import PostCard from './post-card';
import PostPagination from './post-pagination';
import { usePaginated } from '@/lib/use-paginated';
import { useVisited } from '@/lib/use-visited';

interface PostCardListProps {
  posts: PostWithData[];
  pageSize?: number;
  // Changing this value resets pagination to page 1 (e.g. when the sort changes).
  resetKey?: string | number;
}

export default function PostCardList({ posts, pageSize, resetKey }: PostCardListProps) {
  const { page, setPage, totalPages, paginated } = usePaginated(posts, pageSize);
  const visited = useVisited();

  // When the list shrinks (e.g. unsaving) past the current page, snap back so
  // the user doesn't land on a blank view.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  useEffect(() => {
    if (resetKey !== undefined) setPage(1);
  }, [resetKey, setPage]);

  return (
    <>
      <ul className="space-y-3">
        {paginated.map((post) => {
          const isVisited = visited.has(post.id);
          return (
            <li
              key={post.id}
              data-visited={isVisited || undefined}
              // Fade visited cards so the unread ones still draw the eye —
              // explicitly NOT a sort-order change, just a tiny visual hint.
              className={`rise transition-opacity duration-300 motion-reduce:transition-none ${
                isVisited ? 'opacity-60 hover:opacity-100' : 'opacity-100'
              }`}
            >
              <PostCard post={post} />
            </li>
          );
        })}
      </ul>
      <PostPagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
