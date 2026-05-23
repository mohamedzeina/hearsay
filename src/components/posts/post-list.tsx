import type { PostWithData } from '@/db/queries/posts';
import PostCard from './post-card';
import PostEmpty from './post-empty';
import VisitedLi from './visited-li';

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
        <VisitedLi key={post.id} postId={post.id}>
          <PostCard post={post} hideTopic={hideTopic} />
        </VisitedLi>
      ))}
    </ul>
  );
}
