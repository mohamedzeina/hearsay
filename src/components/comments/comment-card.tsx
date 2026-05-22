'use client';

import { useState } from 'react';
import CommentCreateForm from '@/components/comments/comment-create-form';
import CommentEditForm from '@/components/comments/comment-edit-form';
import DeleteButton from '@/components/common/delete-button';
import Avatar from '@/components/common/avatar';
import AuthorName from '@/components/common/author-name';
import VoteButton from '@/components/votes/vote-button';
import Markdown from '@/components/common/markdown';
import { useCopyLink } from '@/components/comments/use-copy-link';
import { deleteComment } from '@/actions';
import { timeAgo } from '@/lib/utils';
import { IconPencil, IconLink, IconCheck } from '@/components/icons';

interface CommentCardProps {
  comment: {
    id: string;
    postId: string;
    userId: string;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
    deleted: boolean;
    user: { name: string | null; image: string | null; username: string | null };
    _count: { votes: number };
    votes: { id: string }[];
  };
  isOwner: boolean;
  hasReplies: boolean;
  children?: React.ReactNode;
}

// Comment lifecycle:
//   live      — normal render
//   deleted   — soft-deleted (had replies); show gravestone with thread intact
//   hidden    — hard-deleted (no replies); render nothing
type Lifecycle = 'live' | 'deleted' | 'hidden';

export default function CommentCard({
  comment,
  isOwner,
  hasReplies,
  children,
}: CommentCardProps) {
  const [lifecycle, setLifecycle] = useState<Lifecycle>(
    comment.deleted ? 'deleted' : 'live'
  );
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleDeleteSuccess = () => {
    setLifecycle(hasReplies ? 'deleted' : 'hidden');
  };

  if (lifecycle === 'hidden') return null;
  if (lifecycle === 'deleted') {
    return <DeletedCommentCard>{children}</DeletedCommentCard>;
  }

  return (
    <div className="rounded-2xl border border-rule bg-surface shadow-soft transition-shadow duration-200 motion-reduce:transition-none hover:shadow-lift/40">
      <div className="flex gap-3 p-4">
        <div className="flex flex-col items-center shrink-0">
          <Avatar user={comment.user} size="md" />
          {children && (
            <CollapseRail
              collapsed={collapsed}
              onToggle={() => setCollapsed((c) => !c)}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <CommentMeta
              user={comment.user}
              createdAt={comment.createdAt}
              editedAt={comment.editedAt}
            />
            {!editing && (
              <CommentActions
                commentId={comment.id}
                isOwner={isOwner}
                onEdit={() => setEditing(true)}
                onDeleteSuccess={handleDeleteSuccess}
              />
            )}
          </div>

          {editing ? (
            <CommentEditForm
              commentId={comment.id}
              initialContent={comment.content}
              onCancel={() => setEditing(false)}
              onSuccess={() => setEditing(false)}
            />
          ) : (
            <>
              <Markdown content={comment.content} variant="comment" />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <VoteButton
                  kind="comment"
                  id={comment.id}
                  initialCount={comment._count.votes}
                  initialVoted={comment.votes.length > 0}
                  size="sm"
                />
                <CommentCreateForm postId={comment.postId} parentId={comment.id} />
              </div>
            </>
          )}
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

function DeletedCommentCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-rule-2 bg-cream-2/40 px-4 py-3">
      <p className="text-sm text-ink-3 italic">[comment deleted]</p>
      {children && <ThreadChildren>{children}</ThreadChildren>}
    </div>
  );
}

function CollapseRail({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const label = collapsed ? 'Expand replies' : 'Collapse replies';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="group mt-2 flex-1 w-[3px] rounded-full bg-rule hover:bg-persimmon transition-colors duration-150 motion-reduce:transition-none min-h-[20px]"
    >
      <span className="sr-only">{label}</span>
    </button>
  );
}

function CommentMeta({
  user,
  createdAt,
  editedAt,
}: {
  user: { name: string | null; image: string | null; username: string | null };
  createdAt: Date;
  editedAt: Date | null;
}) {
  return (
    <div className="flex items-baseline flex-wrap gap-x-2">
      <AuthorName
        user={user}
        className="text-sm font-semibold text-ink hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
      />
      <span className="w-0.5 h-0.5 rounded-full bg-ink-3" aria-hidden />
      <time
        dateTime={createdAt.toISOString()}
        className="text-[11px] font-mono text-ink-2"
        suppressHydrationWarning
      >
        {timeAgo(createdAt)}
      </time>
      {editedAt && (
        <>
          <span className="w-0.5 h-0.5 rounded-full bg-ink-3" aria-hidden />
          <span
            className="text-[11px] font-mono italic text-ink-3"
            title={`Edited ${new Date(editedAt).toLocaleString()}`}
            suppressHydrationWarning
          >
            edited {timeAgo(editedAt)}
          </span>
        </>
      )}
    </div>
  );
}

function CommentActions({
  commentId,
  isOwner,
  onEdit,
  onDeleteSuccess,
}: {
  commentId: string;
  isOwner: boolean;
  onEdit: () => void;
  onDeleteSuccess: () => void;
}) {
  const { copied, copy } = useCopyLink(commentId);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy link to this comment"
        title={copied ? 'Copied!' : 'Copy link to this comment'}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-2 hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
      >
        {copied ? (
          <>
            <IconCheck className="w-3 h-3" />
            Copied
          </>
        ) : (
          <>
            <IconLink className="w-3 h-3" />
            Link
          </>
        )}
      </button>
      {isOwner && (
        <>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-2 hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
          >
            <IconPencil className="w-3 h-3" />
            Edit
          </button>
          <DeleteButton
            action={deleteComment.bind(null, commentId)}
            confirmMessage="Delete this comment?"
            onSuccess={onDeleteSuccess}
          />
        </>
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
