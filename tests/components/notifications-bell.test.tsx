import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsBell from '@/components/notifications/notifications-bell';
import {
  NOTIF_ALL_READ_EVENT,
  NOTIF_READ_EVENT,
} from '@/lib/notifications-bus';
import type { NotificationItem } from '@/db/queries/notifications';

const markOneMock = vi.fn();
const markAllMock = vi.fn();

vi.mock('@/actions', () => ({
  markNotificationRead: (...args: unknown[]) => markOneMock(...args),
  markAllNotificationsRead: (...args: unknown[]) => markAllMock(...args),
}));

function makeNotification(
  overrides: Partial<NotificationItem> & { id: string }
): NotificationItem {
  return {
    id: overrides.id,
    recipientId: 'me',
    actorId: 'alice',
    kind: overrides.kind ?? 'REPLY_TO_POST',
    postId: 'p1',
    commentId: overrides.commentId ?? 'c1',
    readAt: overrides.readAt ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-05-22T12:00:00Z'),
    actor: {
      name: overrides.actor?.name ?? 'Alice',
      image: null,
      username: 'alice',
    },
    post: {
      id: 'p1',
      title: 'How to brew the perfect espresso',
      topic: { slug: 'coffee' },
    },
    comment: { id: 'c1' },
    ...overrides,
  } as NotificationItem;
}

describe('NotificationsBell', () => {
  beforeEach(() => {
    markOneMock.mockReset();
    markAllMock.mockReset();
  });

  it('shows the unread count badge', () => {
    render(<NotificationsBell items={[]} unread={3} />);
    expect(screen.getByRole('button')).toHaveAccessibleName(/3 unread/i);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('caps the displayed badge at 99+', () => {
    render(<NotificationsBell items={[]} unread={250} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('hides the badge when there are no unread notifications', () => {
    const { container } = render(
      <NotificationsBell items={[]} unread={0} />
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Notifications');
    expect(container.querySelector('span.bg-persimmon')).not.toBeInTheDocument();
  });

  it('does NOT auto-mark items as read on dropdown open', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[makeNotification({ id: 'n1' })]}
        unread={1}
      />
    );

    await user.click(screen.getByRole('button', { name: /1 unread/i }));

    expect(markOneMock).not.toHaveBeenCalled();
    expect(markAllMock).not.toHaveBeenCalled();
    // Badge stays at 1 — we never auto-cleared.
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('marks just the clicked item read and decrements the badge', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[
          makeNotification({ id: 'n1' }),
          makeNotification({ id: 'n2' }),
        ]}
        unread={2}
      />
    );

    await user.click(screen.getByRole('button', { name: /2 unread/i }));
    const [firstRow] = screen.getAllByRole('menuitem');
    await user.click(firstRow);

    await waitFor(() => expect(markOneMock).toHaveBeenCalledWith('n1'));
    // Badge dropped by 1, not all.
    expect(markAllMock).not.toHaveBeenCalled();
  });

  it('awaits markNotificationRead before navigating (so the destination bell sees the write)', async () => {
    const user = userEvent.setup();

    // Defer the action so we can confirm the bell waits on it before
    // assigning to location.href.
    let resolveAction!: () => void;
    markOneMock.mockImplementation(
      () => new Promise<void>((r) => {
        resolveAction = r;
      })
    );

    // jsdom's `location.href` setter is non-configurable, so swap the
    // whole location object for a spy-backed stand-in.
    const hrefSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, set href(v: string) { hrefSpy(v); } },
    });

    render(
      <NotificationsBell items={[makeNotification({ id: 'n1' })]} unread={1} />
    );
    await user.click(screen.getByRole('button', { name: /1 unread/i }));
    await user.click(screen.getByRole('menuitem'));

    // Server action invoked optimistically — but navigation is deferred
    // until the action settles.
    expect(markOneMock).toHaveBeenCalledWith('n1');
    expect(hrefSpy).not.toHaveBeenCalled();

    // Once the action resolves, the bell completes the deferred nav.
    resolveAction();
    await waitFor(() => expect(hrefSpy).toHaveBeenCalledTimes(1));
    expect(hrefSpy).toHaveBeenCalledWith(
      expect.stringContaining('/topics/coffee/posts/p1#c-c1')
    );

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('does NOT decrement the badge or re-fire markRead when clicking an already-read row', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[
          makeNotification({ id: 'n1' }),
          makeNotification({ id: 'n2' }),
        ]}
        unread={2}
      />
    );

    // First click → marks n1 read, badge drops to 1.
    await user.click(screen.getByRole('button', { name: /2 unread/i }));
    await user.click(screen.getAllByRole('menuitem')[0]);
    await waitFor(() => expect(markOneMock).toHaveBeenCalledTimes(1));

    // Re-open and click the SAME (now-read) row twice more. Badge must
    // stay at 1 — the server action must not be re-fired either.
    await user.click(screen.getByRole('button', { name: /1 unread/i }));
    await user.click(screen.getAllByRole('menuitem')[0]);
    await user.click(screen.getByRole('button', { name: /1 unread/i }));
    await user.click(screen.getAllByRole('menuitem')[0]);

    expect(markOneMock).toHaveBeenCalledTimes(1);
    // Badge still shows 1 — the unread n2 row.
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('clears all unread when the "Mark all read" pill is clicked', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[
          makeNotification({ id: 'n1' }),
          makeNotification({ id: 'n2' }),
        ]}
        unread={2}
      />
    );

    await user.click(screen.getByRole('button', { name: /2 unread/i }));
    await user.click(screen.getByRole('button', { name: /mark all read/i }));

    await waitFor(() => expect(markAllMock).toHaveBeenCalledTimes(1));
    // Badge clears; the per-row pill disappears since there are no visible unread.
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /mark all read/i })
    ).not.toBeInTheDocument();
  });

  it('hides the "Mark all read" pill when nothing in the dropdown is unread', async () => {
    const user = userEvent.setup();
    const read = makeNotification({
      id: 'n1',
      readAt: new Date('2026-05-21T12:00:00Z'),
    });
    render(<NotificationsBell items={[read]} unread={0} />);

    await user.click(screen.getByRole('button'));
    expect(
      screen.queryByRole('button', { name: /mark all read/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/no new/i)).toBeInTheDocument();
  });

  it('opens the dropdown empty-state when there are no items', async () => {
    const user = userEvent.setup();
    render(<NotificationsBell items={[]} unread={0} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });

  it('shows the "older unread" footer when unread exceeds visible items', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[makeNotification({ id: 'n1' })]}
        unread={31}
      />
    );

    await user.click(screen.getByRole('button', { name: /31 unread/i }));

    expect(
      screen.getByText(/30 older unread/i)
    ).toBeInTheDocument();
  });

  it('does NOT show the older-unread footer when the visible list covers everything', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[makeNotification({ id: 'n1' })]}
        unread={1}
      />
    );

    await user.click(screen.getByRole('button', { name: /1 unread/i }));

    expect(screen.queryByText(/older unread/i)).not.toBeInTheDocument();
  });

  it('renders a "See all" footer link to /notifications when there are items', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[makeNotification({ id: 'n1' })]}
        unread={1}
      />
    );

    await user.click(screen.getByRole('button', { name: /1 unread/i }));

    const seeAll = screen.getByRole('link', { name: /see all/i });
    expect(seeAll).toHaveAttribute('href', '/notifications');
  });

  it('hides the "See all" footer when the dropdown has no items', async () => {
    const user = userEvent.setup();
    render(<NotificationsBell items={[]} unread={0} />);

    await user.click(screen.getByRole('button'));

    expect(
      screen.queryByRole('link', { name: /see all/i })
    ).not.toBeInTheDocument();
  });

  it('renders an item with the right verb and deep-link to the comment', async () => {
    const user = userEvent.setup();
    const n = makeNotification({
      id: 'n1',
      kind: 'REPLY_TO_POST',
      commentId: 'c42',
    });
    render(<NotificationsBell items={[n]} unread={1} />);

    await user.click(screen.getByRole('button', { name: /1 unread/i }));

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/replied to your post/i)).toBeInTheDocument();

    const link = screen.getByRole('menuitem');
    expect(link).toHaveAttribute('href', '/topics/coffee/posts/p1#c-c42');
  });

  it('renders distinct verbs for each notification kind', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[
          makeNotification({ id: '1', kind: 'REPLY_TO_POST' }),
          makeNotification({ id: '2', kind: 'REPLY_TO_COMMENT' }),
          makeNotification({ id: '3', kind: 'UPVOTE_POST', commentId: null }),
          makeNotification({ id: '4', kind: 'UPVOTE_COMMENT' }),
        ]}
        unread={4}
      />
    );

    await user.click(screen.getByRole('button', { name: /4 unread/i }));

    expect(screen.getByText('replied to your post')).toBeInTheDocument();
    expect(screen.getByText('replied to your comment')).toBeInTheDocument();
    expect(screen.getByText('upvoted your post')).toBeInTheDocument();
    expect(screen.getByText('upvoted your comment')).toBeInTheDocument();
  });

  it('prefixes the post title with "in" for comment-kind notifications', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[
          makeNotification({ id: '1', kind: 'REPLY_TO_COMMENT' }),
          makeNotification({ id: '2', kind: 'UPVOTE_COMMENT' }),
        ]}
        unread={2}
      />
    );

    await user.click(screen.getByRole('button', { name: /2 unread/i }));

    // Both *_COMMENT rows label the title as location, not subject.
    expect(screen.getAllByText('in')).toHaveLength(2);
  });

  it('does NOT prefix the post title with "in" for post-kind notifications', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[
          makeNotification({ id: '1', kind: 'REPLY_TO_POST' }),
          makeNotification({ id: '2', kind: 'UPVOTE_POST', commentId: null }),
        ]}
        unread={2}
      />
    );

    await user.click(screen.getByRole('button', { name: /2 unread/i }));

    expect(screen.queryByText('in')).not.toBeInTheDocument();
  });

  it('uses the post URL (no anchor) for non-comment notifications', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsBell
        items={[
          makeNotification({
            id: 'n1',
            kind: 'UPVOTE_POST',
            commentId: null,
          }),
        ]}
        unread={1}
      />
    );

    await user.click(screen.getByRole('button', { name: /1 unread/i }));

    const link = screen.getByRole('menuitem');
    expect(link).toHaveAttribute('href', '/topics/coffee/posts/p1');
  });

  describe('cross-component bus', () => {
    it('decrements the badge when the /notifications list dispatches a row-read event', () => {
      render(
        <NotificationsBell
          items={[
            makeNotification({ id: 'n1' }),
            makeNotification({ id: 'n2' }),
          ]}
          unread={2}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();

      act(() => {
        window.dispatchEvent(
          new CustomEvent(NOTIF_READ_EVENT, { detail: { id: 'n1' } })
        );
      });

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('decrements the badge for older rows the bell does not have locally', () => {
      // Bell holds only 1 visible row; unread count covers an older row
      // that the dropdown does not have in localItems. The list can still
      // emit a read event for that older id; the bell trusts the dispatcher
      // and decrements the badge.
      render(
        <NotificationsBell
          items={[makeNotification({ id: 'visible' })]}
          unread={5}
        />
      );

      act(() => {
        window.dispatchEvent(
          new CustomEvent(NOTIF_READ_EVENT, { detail: { id: 'older-row' } })
        );
      });

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('does NOT decrement again when the same row is dispatched twice', () => {
      render(
        <NotificationsBell
          items={[makeNotification({ id: 'n1' })]}
          unread={1}
        />
      );

      act(() => {
        window.dispatchEvent(
          new CustomEvent(NOTIF_READ_EVENT, { detail: { id: 'n1' } })
        );
      });
      // First dispatch clears the only unread row → badge gone.
      expect(screen.queryByText('1')).not.toBeInTheDocument();

      act(() => {
        window.dispatchEvent(
          new CustomEvent(NOTIF_READ_EVENT, { detail: { id: 'n1' } })
        );
      });
      // Second dispatch must be a no-op (row already marked read locally) —
      // it must not underflow the badge or re-introduce one.
      expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
    });

    it('clears the badge and marks every visible row read on the all-read event', () => {
      render(
        <NotificationsBell
          items={[
            makeNotification({ id: 'n1' }),
            makeNotification({ id: 'n2' }),
          ]}
          unread={5}
        />
      );

      act(() => {
        window.dispatchEvent(new CustomEvent(NOTIF_ALL_READ_EVENT));
      });

      // Badge clears even though unread > visible items (older unread
      // accounted for in the prop).
      expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
    });

    it('removes its window listeners on unmount', () => {
      const { unmount } = render(
        <NotificationsBell
          items={[makeNotification({ id: 'n1' })]}
          unread={1}
        />
      );

      unmount();

      // Dispatching after unmount must NOT throw / try to setState on
      // an unmounted component (React would warn).
      const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
      act(() => {
        window.dispatchEvent(
          new CustomEvent(NOTIF_READ_EVENT, { detail: { id: 'n1' } })
        );
        window.dispatchEvent(new CustomEvent(NOTIF_ALL_READ_EVENT));
      });
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });
});
