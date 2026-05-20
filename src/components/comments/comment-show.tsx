import CommentCard from '@/components/comments/comment-card';
import type { CommentWithAuthor } from '@/db/queries/comments';

interface CommentShowProps {
  comment: CommentWithAuthor;
  childrenByParent: Map<string | null, CommentWithAuthor[]>;
  currentUserId: string | null;
}

export default function CommentShow({
  comment,
  childrenByParent,
  currentUserId,
}: CommentShowProps) {
  const children = childrenByParent.get(comment.id) ?? [];
  const isOwner = currentUserId === comment.userId;

  const rendered = children.map((child) => (
    <CommentShow
      key={child.id}
      comment={child}
      childrenByParent={childrenByParent}
      currentUserId={currentUserId}
    />
  ));

  return (
    <CommentCard
      comment={comment}
      isOwner={isOwner}
      hasReplies={children.length > 0}
    >
      {rendered.length > 0 ? rendered : null}
    </CommentCard>
  );
}
