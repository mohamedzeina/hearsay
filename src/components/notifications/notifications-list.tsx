'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/actions';
import Avatar from '@/components/common/avatar';
import { IconBell, IconReply } from '@/components/icons';
import PostPagination from '@/components/posts/post-pagination';
import {
  dispatchAllNotificationsRead,
  dispatchNotificationRead,
} from '@/lib/notifications-bus';
import { usePaginated } from '@/lib/use-paginated';
import { timeAgo } from '@/lib/utils';
import paths from '@/paths';
import type { NotificationItem } from '@/db/queries/notifications';

const PAGE_SIZE = 10;

type Filter = 'all' | 'replies' | 'upvotes' | 'mentions';

const FILTER_KINDS: Record<Exclude<Filter, 'all'>, ReadonlySet<string>> = {
  replies: new Set(['REPLY_TO_POST', 'REPLY_TO_COMMENT']),
  upvotes: new Set(['UPVOTE_POST', 'UPVOTE_COMMENT']),
  mentions: new Set(['MENTION']),
};

const FILTER_LABEL: Record<Filter, string> = {
  all: 'All',
  replies: 'Replies',
  upvotes: 'Upvotes',
  mentions: 'Mentions',
};

interface NotificationsListProps {
  initialItems: NotificationItem[];
}

export default function NotificationsList({
  initialItems,
}: NotificationsListProps) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>('all');
  const [, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    const kinds = FILTER_KINDS[filter];
    return items.filter((n) => kinds.has(n.kind));
  }, [items, filter]);

  const { page, setPage, totalPages, paginated } = usePaginated(
    filteredItems,
    PAGE_SIZE
  );

  // When the list shrinks (shouldn't normally happen here, but guard) snap
  // back so the user doesn't land on a blank page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  const handleFilterChange = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };

  const unreadCount = items.filter((n) => !n.readAt).length;

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    // Already read: nothing to do, let the default nav happen.
    const target = items.find((n) => n.id === id);
    if (!target || target.readAt) return;

    // Modifier-clicks open a new tab — fire-and-forget the action and
    // let the default new-tab navigation through.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      const now = new Date();
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: now } : n))
      );
      dispatchNotificationRead(id);
      startTransition(() => {
        markNotificationRead(id);
      });
      return;
    }

    // Plain left-click: await the server action before navigating so the
    // destination's server-rendered bell doesn't race with the write and
    // show the row as unread again.
    e.preventDefault();
    const href = e.currentTarget.href;
    const now = new Date();
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: now } : n))
    );
    dispatchNotificationRead(id);
    void (async () => {
      try {
        await markNotificationRead(id);
      } finally {
        window.location.href = href;
      }
    })();
  };

  const handleMarkAllRead = () => {
    const now = new Date();
    setItems((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: now }))
    );
    dispatchAllNotificationsRead();
    startTransition(() => {
      markAllNotificationsRead();
    });
  };

  return (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
            your activity
          </p>
          <h1 className="mt-1 font-display font-extrabold tracking-tight text-3xl sm:text-4xl text-ink">
            Notifications
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
          >
            Mark all read
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <FilterPills value={filter} onChange={handleFilterChange} />
          {filteredItems.length === 0 ? (
            <FilterEmptyState filter={filter} />
          ) : (
            <>
              <ul className="space-y-3">
                {paginated.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onClick={(e) => handleItemClick(e, n.id)}
                  />
                ))}
              </ul>
              <PostPagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}
    </>
  );
}

function FilterPills({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (next: Filter) => void;
}) {
  const filters: Filter[] = ['all', 'replies', 'upvotes', 'mentions'];
  return (
    <div
      role="tablist"
      aria-label="Filter notifications"
      className="mb-5 inline-flex items-center gap-1 rounded-full bg-cream-2 p-1 border border-rule"
    >
      {filters.map((f) => (
        <button
          key={f}
          role="tab"
          aria-selected={value === f}
          onClick={() => onChange(f)}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all duration-200 motion-reduce:transition-none ${
            value === f
              ? 'bg-surface text-ink shadow-soft'
              : 'text-ink-2 hover:text-ink'
          }`}
        >
          <FilterIcon filter={f} />
          {FILTER_LABEL[f]}
        </button>
      ))}
    </div>
  );
}

function FilterIcon({ filter }: { filter: Filter }) {
  if (filter === 'replies') {
    return <IconReply className="w-3 h-3" />;
  }
  if (filter === 'upvotes') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3"
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    );
  }
  if (filter === 'mentions') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9" />
      </svg>
    );
  }
  // 'all' — a small dot, so the pill row stays visually balanced.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3 h-3"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FilterEmptyState({ filter }: { filter: Filter }) {
  const label = FILTER_LABEL[filter].toLowerCase();
  return (
    <div className="rounded-2xl border border-dashed border-rule-2 bg-cream-2/30 px-6 py-10 text-center">
      <p className="text-sm text-ink-2">
        No {label} to show yet.
      </p>
    </div>
  );
}

function NotificationRow({
  n,
  onClick,
}: {
  n: NotificationItem;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  // Underlying post may be gone (cascade-delete protects us, but be defensive
  // in case the row is in flight to deletion).
  if (!n.post) return null;

  const verb =
    n.kind === 'REPLY_TO_POST'
      ? 'replied to your post'
      : n.kind === 'REPLY_TO_COMMENT'
        ? 'replied to your comment'
        : n.kind === 'UPVOTE_POST'
          ? 'upvoted your post'
          : n.kind === 'UPVOTE_COMMENT'
            ? 'upvoted your comment'
            : n.kind === 'MENTION'
              ? 'mentioned you'
              : 'reacted';

  const titleIsLocation =
    n.kind === 'REPLY_TO_COMMENT' ||
    n.kind === 'UPVOTE_COMMENT' ||
    n.kind === 'MENTION';

  const href = n.commentId
    ? `${paths.postShow(n.post.topic.slug, n.post.id)}#c-${n.commentId}`
    : paths.postShow(n.post.topic.slug, n.post.id);

  const actorName = n.actor.name ?? 'someone';

  return (
    <li className="rise">
      {/* Plain <a> on purpose: matches the bell rows so cross-page hash
          deep-links scroll reliably (Next App Router client-side nav fires
          the hash scroll before the target comment has hydrated). */}
      <a
        href={href}
        onClick={onClick}
        className={`block rounded-2xl border shadow-soft transition-all duration-200 motion-reduce:transition-none hover:shadow-lift/40 ${
          n.readAt
            ? 'border-rule bg-surface'
            : 'border-persimmon-soft bg-persimmon-soft/20'
        }`}
      >
        <div className="flex items-start gap-3 px-5 py-4">
          <Avatar user={n.actor} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug">
              <span className="font-semibold text-ink">{actorName}</span>{' '}
              <span className="text-ink-2">{verb}</span>
            </p>
            <p className="text-sm text-ink-2 truncate mt-0.5 italic">
              {titleIsLocation && (
                <span className="not-italic text-ink-3">in </span>
              )}
              &ldquo;{n.post.title}&rdquo;
            </p>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 mt-1.5"
              suppressHydrationWarning
            >
              {timeAgo(new Date(n.createdAt))}
            </p>
          </div>
          {!n.readAt && (
            <span
              aria-hidden
              className="mt-1.5 w-2 h-2 rounded-full bg-persimmon shrink-0"
            />
          )}
        </div>
      </a>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-rule-2 bg-cream-2/30 px-6 py-14 text-center">
      <IconBell className="w-8 h-8 mx-auto text-ink-3 mb-3" aria-hidden />
      <p className="font-display font-bold text-lg text-ink mb-1">
        Nothing&rsquo;s happened yet
      </p>
      <p className="text-sm text-ink-2 mb-4 max-w-sm mx-auto">
        Replies and upvotes on your posts and comments will show up
        here as soon as they roll in.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon transition-colors duration-150 motion-reduce:transition-none"
      >
        Browse posts &rarr;
      </Link>
    </div>
  );
}
