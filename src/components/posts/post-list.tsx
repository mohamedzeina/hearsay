import type { PostWithData } from '@/db/queries/posts';
import PostCard from './post-card';
import PostEmpty from './post-empty';

interface PostListProps {
  fetchData: () => Promise<PostWithData[]>;
  hideTopic?: boolean;
}

export default async function PostList({
  fetchData,
  hideTopic,
}: PostListProps) {
  const posts = await fetchData();

  if (posts.length === 0) {
    return <PostEmpty />;
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} hideTopic={hideTopic} />
        </li>
      ))}
    </ul>
  );
}
