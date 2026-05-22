'use client';

import { useMemo, useState } from 'react';
import CommentShow from '@/components/comments/comment-show';
import type { CommentWithAuthor } from '@/db/queries/comments';
import { IconReply } from '@/components/icons';

type Sort = 'top' | 'new' | 'old';

const SORT_SUBTITLE: Record<Sort, string> = {
  top: 'Most upvoted first',
  new: 'Newest first',
  old: 'Oldest first',
};

interface CommentListClientProps {
  comments: CommentWithAuthor[];
  currentUserId: string | null;
}

export default function CommentListClient({
  comments,
  currentUserId,
}: CommentListClientProps) {
  const [sort, setSort] = useState<Sort>('new');

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, CommentWithAuthor[]>();
    for (const c of comments) {
      const arr = map.get(c.parentId);
      if (arr) arr.push(c);
      else map.set(c.parentId, [c]);
    }
    return map;
  }, [comments]);

  const sortedTopLevel = useMemo(() => {
    const top = childrenByParent.get(null) ?? [];
    const copy = [...top];
    copy.sort((a, b) => {
      if (sort === 'top') {
        const diff = b._count.votes - a._count.votes;
        if (diff !== 0) return diff;
        // Tie-break newer-first so ordering is stable and intuitive.
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const aTs = new Date(a.createdAt).getTime();
      const bTs = new Date(b.createdAt).getTime();
      return sort === 'new' ? bTs - aTs : aTs - bTs;
    });
    return copy;
  }, [childrenByParent, sort]);

  const activeCount = comments.filter((c) => !c.deleted).length;
  const hasReplies = sortedTopLevel.length > 0;

  return (
    <section aria-label="Comments">
      <header className="flex items-end justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-xl text-ink tracking-tight">
            {activeCount === 0
              ? 'The discussion'
              : `${activeCount} ${activeCount === 1 ? 'reply' : 'replies'}`}
          </h2>
          {hasReplies && (
            <p className="mt-0.5 text-xs text-ink-2">{SORT_SUBTITLE[sort]}</p>
          )}
        </div>
        {hasReplies && (
          <div
            role="tablist"
            aria-label="Sort comments"
            className="inline-flex items-center gap-1 rounded-full bg-cream-2 p-1 border border-rule"
          >
            {(['top', 'new', 'old'] as Sort[]).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={sort === s}
                onClick={() => setSort(s)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold capitalize transition-all duration-200 motion-reduce:transition-none ${
                  sort === s
                    ? 'bg-surface text-ink shadow-soft'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {s === 'top' && (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="m12 2 2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1z" />
                  </svg>
                )}
                {s === 'new' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                )}
                {s === 'old' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <path d="M3 4v5h5" />
                  </svg>
                )}
                {s}
              </button>
            ))}
          </div>
        )}
      </header>

      {!hasReplies ? (
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
          {sortedTopLevel.map((comment) => (
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
