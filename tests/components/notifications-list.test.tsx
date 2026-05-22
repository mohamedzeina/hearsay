import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsList from '@/components/notifications/notifications-list';
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

function makeMany(count: number): NotificationItem[] {
  return Array.from({ length: count }, (_, i) =>
    makeNotification({ id: `n${i + 1}` })
  );
}

describe('NotificationsList', () => {
  beforeEach(() => {
    markOneMock.mockReset();
    markAllMock.mockReset();
  });

  it('renders the empty state when there are no items', () => {
    render(<NotificationsList initialItems={[]} />);
    expect(screen.getByText(/nothing.s happened yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse posts/i })
    ).toBeInTheDocument();
    // No "Mark all read" pill in the empty state.
    expect(
      screen.queryByRole('button', { name: /mark all read/i })
    ).not.toBeInTheDocument();
  });

  it('shows the heading and "Mark all read" pill when there are unread items', () => {
    render(<NotificationsList initialItems={[makeNotification({ id: 'n1' })]} />);
    expect(
      screen.getByRole('heading', { name: /notifications/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /mark all read/i })
    ).toBeInTheDocument();
  });

  it('hides "Mark all read" when nothing is unread', () => {
    const read = makeNotification({
      id: 'n1',
      readAt: new Date('2026-05-21T12:00:00Z'),
    });
    render(<NotificationsList initialItems={[read]} />);
    expect(
      screen.queryByRole('button', { name: /mark all read/i })
    ).not.toBeInTheDocument();
  });

  it('paginates at 10 per page and navigates between pages', async () => {
    const user = userEvent.setup();
    render(<NotificationsList initialItems={makeMany(25)} />);

    // First page: 10 rows visible, Previous disabled.
    const prev = screen.getByRole('button', { name: /previous/i });
    const next = screen.getByRole('button', { name: /next/i });
    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();
    expect(screen.getAllByRole('link', { name: /Alice/i })).toHaveLength(10);

    await user.click(next);
    expect(prev).toBeEnabled();
    expect(next).toBeEnabled();
    expect(screen.getAllByRole('link', { name: /Alice/i })).toHaveLength(10);

    await user.click(next);
    // Last page: only 5 items left, Next disabled.
    expect(next).toBeDisabled();
    expect(screen.getAllByRole('link', { name: /Alice/i })).toHaveLength(5);
  });

  it('omits the pagination nav when everything fits on one page', () => {
    render(<NotificationsList initialItems={makeMany(3)} />);
    expect(screen.queryByRole('navigation', { name: /pagination/i }))
      .not.toBeInTheDocument();
  });

  it('marks a clicked row read and persists via the server action', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsList
        initialItems={[
          makeNotification({ id: 'n1' }),
          makeNotification({ id: 'n2' }),
        ]}
      />
    );

    const [firstRow] = screen.getAllByRole('link', { name: /Alice/i });
    await user.click(firstRow);

    await waitFor(() => expect(markOneMock).toHaveBeenCalledWith('n1'));
    expect(markAllMock).not.toHaveBeenCalled();
  });

  it('clears all unread when "Mark all read" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsList
        initialItems={[
          makeNotification({ id: 'n1' }),
          makeNotification({ id: 'n2' }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /mark all read/i }));
    await waitFor(() => expect(markAllMock).toHaveBeenCalledTimes(1));
    // Pill disappears since there are no remaining unread.
    expect(
      screen.queryByRole('button', { name: /mark all read/i })
    ).not.toBeInTheDocument();
  });

  it('builds correct deep links for comment-kind notifications', () => {
    render(
      <NotificationsList
        initialItems={[
          makeNotification({
            id: 'n1',
            kind: 'REPLY_TO_COMMENT',
            commentId: 'c42',
          }),
        ]}
      />
    );

    const link = screen.getByRole('link', { name: /Alice/i });
    expect(link).toHaveAttribute('href', '/topics/coffee/posts/p1#c-c42');
  });

  it('uses the post URL (no anchor) for post-kind notifications', () => {
    render(
      <NotificationsList
        initialItems={[
          makeNotification({
            id: 'n1',
            kind: 'UPVOTE_POST',
            commentId: null,
          }),
        ]}
      />
    );

    const link = screen.getByRole('link', { name: /Alice/i });
    expect(link).toHaveAttribute('href', '/topics/coffee/posts/p1');
  });
});
