import CommentShow from '@/components/comments/comment-show';
import {
  fetchCommentsByPostId,
  type CommentWithAuthor,
} from '@/db/queries/comments';
import { auth } from '@/auth';
import { IconReply } from '@/components/icons';

interface CommentListProps {
  postId: string;
}

export default async function CommentList({ postId }: CommentListProps) {
  const [comments, session] = await Promise.all([
    fetchCommentsByPostId(postId),
    auth(),
  ]);

  const childrenByParent = new Map<string | null, CommentWithAuthor[]>();
  for (const c of comments) {
    const arr = childrenByParent.get(c.parentId);
    if (arr) arr.push(c);
    else childrenByParent.set(c.parentId, [c]);
  }

  const topLevelComments = childrenByParent.get(null) ?? [];
  const activeCount = comments.filter((c) => !c.deleted).length;
  const currentUserId = session?.user?.id ?? null;

  return (
    <section aria-label="Comments">
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="font-display font-bold text-xl text-ink tracking-tight">
          {activeCount === 0
            ? 'The discussion'
            : `${activeCount} ${activeCount === 1 ? 'reply' : 'replies'}`}
        </h2>
        {activeCount > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2">
            Newest at the top
          </span>
        )}
      </header>

      {topLevelComments.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-rule-2 bg-cream-2/30">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-persimmon-soft mb-3">
            <IconReply strokeWidth={1.8} className="w-5 h-5 text-persimmon-deep" />
          </div>
          <p className="font-display font-bold text-sm text-ink">
            Quiet in here&hellip;
          </p>
          <p className="mt-1 text-xs text-ink-2">
            Be the first to share your thoughts.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {topLevelComments.map((comment) => (
            <li key={comment.id}>
              <CommentShow
                comment={comment}
                childrenByParent={childrenByParent}
                currentUserId={currentUserId}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
