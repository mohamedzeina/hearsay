'use client';

import { useState } from 'react';
import CommentCreateForm from '@/components/comments/comment-create-form';
import DeleteButton from '@/components/common/delete-button';
import Avatar from '@/components/common/avatar';
import { deleteComment } from '@/actions';
import { timeAgo } from '@/lib/utils';

interface CommentCardProps {
  comment: {
    id: string;
    postId: string;
    userId: string;
    content: string;
    createdAt: Date;
    deleted: boolean;
    user: { name: string | null; image: string | null };
  };
  isOwner: boolean;
  hasReplies: boolean;
  children?: React.ReactNode;
}

export default function CommentCard({
  comment,
  isOwner,
  hasReplies,
  children,
}: CommentCardProps) {
  const [deleted, setDeleted] = useState(comment.deleted);
  const [hidden, setHidden] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSuccess = () => {
    if (hasReplies) {
      setDeleted(true);
    } else {
      setHidden(true);
    }
  };

  if (hidden) return null;

  if (deleted) {
    return (
      <div className="rounded-2xl border border-dashed border-rule-2 bg-cream-2/40 px-4 py-3">
        <p className="text-sm text-ink-3 italic">
          [comment deleted]
        </p>
        {children && (
          <ThreadChildren>{children}</ThreadChildren>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rule bg-surface shadow-soft transition-shadow duration-200 motion-reduce:transition-none hover:shadow-lift/40">
      <div className="flex gap-3 p-4">
        {/* Avatar column with collapse rail */}
        <div className="flex flex-col items-center shrink-0">
          <Avatar user={comment.user} size="md" />
          {children && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand replies' : 'Collapse replies'}
              title={collapsed ? 'Expand replies' : 'Collapse replies'}
              className="group mt-2 flex-1 w-[3px] rounded-full bg-rule hover:bg-persimmon transition-colors duration-150 motion-reduce:transition-none min-h-[20px]"
            >
              <span className="sr-only">
                {collapsed ? 'Expand replies' : 'Collapse replies'}
              </span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="text-sm font-semibold text-ink">
                {comment.user.name}
              </span>
              <span className="w-0.5 h-0.5 rounded-full bg-ink-3" aria-hidden />
              <time
                dateTime={comment.createdAt.toISOString()}
                className="text-[11px] font-mono text-ink-2"
                suppressHydrationWarning
              >
                {timeAgo(comment.createdAt)}
              </time>
            </div>
            {isOwner && (
              <DeleteButton
                action={deleteComment.bind(null, comment.id)}
                confirmMessage="Delete this comment?"
                onSuccess={handleSuccess}
              />
            )}
          </div>

          <p className="text-sm text-ink-2 leading-[1.65] whitespace-pre-wrap">
            {comment.content}
          </p>

          <div className="mt-2">
            <CommentCreateForm postId={comment.postId} parentId={comment.id} />
          </div>
        </div>
      </div>

      {children && !collapsed && <ThreadChildren>{children}</ThreadChildren>}

      {children && collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full px-4 py-2 text-left text-xs font-mono uppercase tracking-[0.12em] text-ink-2 hover:text-persimmon border-t border-rule transition-colors duration-150 motion-reduce:transition-none"
        >
          + show replies
        </button>
      )}
    </div>
  );
}

function ThreadChildren({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-5 pr-4 pb-4 pt-1">
      <div className="pl-4 border-l-2 border-rule space-y-3">{children}</div>
    </div>
  );
}
