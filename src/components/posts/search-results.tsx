'use client';

import type { PostWithData } from '@/db/queries/posts';
import PostCardList from './post-card-list';
import PostEmpty from './post-empty';

interface SearchResultsProps {
  posts: PostWithData[];
}

export default function SearchResults({ posts }: SearchResultsProps) {
  if (posts.length === 0) {
    return <PostEmpty variant="search" />;
  }

  return (
    <div>
      <PostCardList posts={posts} />
    </div>
  );
}
