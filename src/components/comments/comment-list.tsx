import { fetchCommentsByPostId } from '@/db/queries/comments';
import { auth } from '@/auth';
import CommentListClient from '@/components/comments/comment-list-client';

interface CommentListProps {
  postId: string;
}

export default async function CommentList({ postId }: CommentListProps) {
  const [comments, session] = await Promise.all([
    fetchCommentsByPostId(postId),
    auth(),
  ]);
  const currentUserId = session?.user?.id ?? null;

  return <CommentListClient comments={comments} currentUserId={currentUserId} />;
}
