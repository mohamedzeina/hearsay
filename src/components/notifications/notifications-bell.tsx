'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/actions';
import { IconBell } from '@/components/icons';
import Avatar from '@/components/common/avatar';
import paths from '@/paths';
import { timeAgo } from '@/lib/utils';
import type { NotificationItem } from '@/db/queries/notifications';

interface NotificationsBellProps {
  items: NotificationItem[];
  unread: number;
}

export default function NotificationsBell({
  items,
  unread,
}: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const [localItems, setLocalItems] = useState(items);
  const [localUnread, setLocalUnread] = useState(unread);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  // Re-sync the optimistic view when fresh server-rendered props arrive
  // (after navigation, the bell re-renders from the latest query).
  useEffect(() => {
    setLocalItems(items);
  }, [items]);
  useEffect(() => {
    setLocalUnread(unread);
  }, [unread]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleUnreadCount = localItems.filter((n) => !n.readAt).length;

  const handleItemClick = (id: string) => {
    // Locally clear this row's unread state and decrement the badge
    // before firing the server action — the click is also navigating
    // away, so the optimistic update is what the user sees in the
    // back-button case.
    const now = new Date();
    setLocalItems((prev) =>
      prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n))
    );
    setLocalUnread((u) => Math.max(0, u - 1));
    startTransition(() => {
      markNotificationRead(id);
    });
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    const now = new Date();
    setLocalItems((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: now }))
    );
    setLocalUnread(0);
    startTransition(() => {
      markAllNotificationsRead();
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          localUnread > 0
            ? `Notifications, ${localUnread} unread`
            : 'Notifications'
        }
        className="relative w-9 h-9 rounded-full bg-surface border border-rule hover:border-rule-2 hover:shadow-soft flex items-center justify-center transition-all duration-200 motion-reduce:transition-none"
      >
        <IconBell className="w-4 h-4 text-ink-2" />
        {localUnread > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-persimmon text-cream text-[10px] font-mono font-bold flex items-center justify-center num-plate"
          >
            {localUnread > 99 ? '99+' : localUnread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[22rem] max-h-[28rem] overflow-y-auto bg-surface border border-rule rounded-2xl shadow-lift-lg z-50 rise"
          role="menu"
        >
          <header className="px-4 py-3 border-b border-rule bg-cream-2/40 flex items-center justify-between gap-3">
            <p className="font-display font-bold text-sm text-ink">
              Notifications
            </p>
            {visibleUnreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2 hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
              >
                Mark all read
              </button>
            ) : (
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                {localItems.length === 0 ? 'all caught up' : 'no new'}
              </p>
            )}
          </header>

          {localItems.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-xs text-ink-2">No notifications yet.</p>
              <p className="mt-1 text-[11px] text-ink-3">
                Replies and upvotes will show up here.
              </p>
            </div>
          ) : (
            <ul>
              {localItems.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onClick={() => handleItemClick(n.id)}
                />
              ))}
            </ul>
          )}

          {localUnread > visibleUnreadCount && (
            <footer className="px-4 py-2.5 border-t border-rule bg-cream-2/30">
              <p className="text-[11px] text-ink-3 leading-snug">
                {localUnread - visibleUnreadCount} older unread —{' '}
                <span className="italic">
                  visible once the full history page ships
                </span>
                .
              </p>
            </footer>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  n,
  onClick,
}: {
  n: NotificationItem;
  onClick: () => void;
}) {
  // Skip if the underlying post is gone (post cascade-deletes notifications,
  // but in transit / soft-state we guard anyway).
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
            : 'reacted';

  // For *_COMMENT kinds, the post title is the *location*, not the subject —
  // prefix with "in" so readers don't mistake it for the comment that was
  // replied to / upvoted. For *_POST kinds, the title IS the subject.
  const titleIsLocation =
    n.kind === 'REPLY_TO_COMMENT' || n.kind === 'UPVOTE_COMMENT';

  const href = n.commentId
    ? `${paths.postShow(n.post.topic.slug, n.post.id)}#c-${n.commentId}`
    : paths.postShow(n.post.topic.slug, n.post.id);

  const actorName = n.actor.name ?? 'someone';

  return (
    <li className={n.readAt ? '' : 'bg-persimmon-soft/30'}>
      {/* Plain <a> on purpose: a Next.js <Link> would client-side navigate */}
      {/* and miss the browser's native hash-anchor scroll because the */}
      {/* target comment element isn't mounted yet at the moment the */}
      {/* router tries to scroll. A full nav guarantees the deep-link */}
      {/* lands on the right #c-{commentId}. */}
      <a
        href={href}
        onClick={onClick}
        role="menuitem"
        className="block px-4 py-3 hover:bg-cream-2/60 transition-colors duration-150 motion-reduce:transition-none border-b border-rule last:border-b-0"
      >
        <div className="flex items-start gap-3">
          <Avatar user={n.actor} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-snug">
              <span className="font-semibold text-ink">{actorName}</span>{' '}
              <span className="text-ink-2">{verb}</span>
            </p>
            <p className="text-xs text-ink-2 truncate mt-0.5 italic">
              {titleIsLocation && (
                <span className="not-italic text-ink-3">in </span>
              )}
              &ldquo;{n.post.title}&rdquo;
            </p>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3 mt-1"
              suppressHydrationWarning
            >
              {timeAgo(new Date(n.createdAt))}
            </p>
          </div>
          {!n.readAt && (
            <span
              aria-hidden
              className="mt-1 w-1.5 h-1.5 rounded-full bg-persimmon shrink-0"
            />
          )}
        </div>
      </a>
    </li>
  );
}
