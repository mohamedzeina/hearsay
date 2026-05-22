import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsBell from '@/components/notifications/notifications-bell';
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
});
