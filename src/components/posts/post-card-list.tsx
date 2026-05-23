'use client';

import { useEffect } from 'react';
import type { PostWithData } from '@/db/queries/posts';
import PostCard from './post-card';
import PostPagination from './post-pagination';
import VisitedLi from './visited-li';
import { usePaginated } from '@/lib/use-paginated';

interface PostCardListProps {
  posts: PostWithData[];
  pageSize?: number;
  // Changing this value resets pagination to page 1 (e.g. when the sort changes).
  resetKey?: string | number;
}

export default function PostCardList({ posts, pageSize, resetKey }: PostCardListProps) {
  const { page, setPage, totalPages, paginated } = usePaginated(posts, pageSize);

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
        {paginated.map((post) => (
          <VisitedLi key={post.id} postId={post.id} className="rise">
            <PostCard post={post} />
          </VisitedLi>
        ))}
      </ul>
      <PostPagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
