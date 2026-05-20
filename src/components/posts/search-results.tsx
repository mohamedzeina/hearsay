'use client';

import type { PostWithData } from '@/db/queries/posts';
import PostCard from './post-card';
import PostEmpty from './post-empty';
import PostPagination from './post-pagination';
import { usePaginated } from '@/lib/use-paginated';

interface SearchResultsProps {
  posts: PostWithData[];
}

export default function SearchResults({ posts }: SearchResultsProps) {
  const { page, setPage, totalPages, paginated } = usePaginated(posts);

  if (posts.length === 0) {
    return <PostEmpty variant="search" />;
  }

  return (
    <div>
      <ul className="space-y-3">
        {paginated.map((post) => (
          <li key={post.id} className="rise">
            <PostCard post={post} />
          </li>
        ))}
      </ul>
      <PostPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
