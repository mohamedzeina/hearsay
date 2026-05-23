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

  describe('filter pills', () => {
    function mixedItems(): NotificationItem[] {
      return [
        makeNotification({ id: 'r1', kind: 'REPLY_TO_POST' }),
        makeNotification({ id: 'r2', kind: 'REPLY_TO_COMMENT' }),
        makeNotification({ id: 'u1', kind: 'UPVOTE_POST', commentId: null }),
        makeNotification({ id: 'u2', kind: 'UPVOTE_COMMENT' }),
        makeNotification({ id: 'm1', kind: 'MENTION' }),
      ];
    }

    it('renders the filter pill row when there are items', () => {
      render(<NotificationsList initialItems={mixedItems()} />);
      const tablist = screen.getByRole('tablist', { name: /filter/i });
      expect(tablist).toBeInTheDocument();
      // All four pills present, "All" selected by default.
      expect(
        screen.getByRole('tab', { name: /^all$/i })
      ).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /^replies$/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /^upvotes$/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /^mentions$/i })).toBeInTheDocument();
    });

    it('omits the filter pill row when there are no items', () => {
      render(<NotificationsList initialItems={[]} />);
      expect(
        screen.queryByRole('tablist', { name: /filter/i })
      ).not.toBeInTheDocument();
    });

    it('shows only reply rows when the Replies filter is selected', async () => {
      const user = userEvent.setup();
      render(<NotificationsList initialItems={mixedItems()} />);

      await user.click(screen.getByRole('tab', { name: /^replies$/i }));

      // Two reply rows are reply kinds (REPLY_TO_POST, REPLY_TO_COMMENT)
      const rows = screen.getAllByRole('link', { name: /Alice/i });
      expect(rows).toHaveLength(2);
      expect(
        screen.getAllByText(/replied to your/i)
      ).toHaveLength(2);
      // Upvote and mention verbs are not in the DOM under this filter.
      expect(screen.queryByText(/upvoted your/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/mentioned you/i)).not.toBeInTheDocument();
    });

    it('shows only upvote rows when the Upvotes filter is selected', async () => {
      const user = userEvent.setup();
      render(<NotificationsList initialItems={mixedItems()} />);

      await user.click(screen.getByRole('tab', { name: /^upvotes$/i }));

      const rows = screen.getAllByRole('link', { name: /Alice/i });
      expect(rows).toHaveLength(2);
      expect(screen.getAllByText(/upvoted your/i)).toHaveLength(2);
      expect(screen.queryByText(/replied to your/i)).not.toBeInTheDocument();
    });

    it('shows only mention rows when the Mentions filter is selected', async () => {
      const user = userEvent.setup();
      render(<NotificationsList initialItems={mixedItems()} />);

      await user.click(screen.getByRole('tab', { name: /^mentions$/i }));

      expect(screen.getAllByRole('link', { name: /Alice/i })).toHaveLength(1);
      expect(screen.getByText(/mentioned you/i)).toBeInTheDocument();
    });

    it('renders a filter-specific empty state when the active filter has no matches', async () => {
      const user = userEvent.setup();
      // Only upvotes in the list — switching to Replies must show an
      // empty state rather than the global no-items copy.
      const items: NotificationItem[] = [
        makeNotification({ id: 'u1', kind: 'UPVOTE_POST', commentId: null }),
        makeNotification({ id: 'u2', kind: 'UPVOTE_COMMENT' }),
      ];
      render(<NotificationsList initialItems={items} />);

      await user.click(screen.getByRole('tab', { name: /^replies$/i }));

      expect(screen.getByText(/no replies to show yet/i)).toBeInTheDocument();
      // The global empty state's CTA must not appear here.
      expect(
        screen.queryByRole('link', { name: /browse posts/i })
      ).not.toBeInTheDocument();
    });

    it('resets to page 1 when the filter changes', async () => {
      const user = userEvent.setup();
      // 12 replies + 12 upvotes — replies span 2 pages on their own.
      const items: NotificationItem[] = [
        ...Array.from({ length: 12 }, (_, i) =>
          makeNotification({ id: `r${i}`, kind: 'REPLY_TO_POST' })
        ),
        ...Array.from({ length: 12 }, (_, i) =>
          makeNotification({ id: `u${i}`, kind: 'UPVOTE_POST', commentId: null })
        ),
      ];
      render(<NotificationsList initialItems={items} />);

      // Page forward into "All" page 2, then switch filter.
      await user.click(screen.getByRole('button', { name: /next/i }));
      // We're now on page 2 (Next becomes disabled at end; we're mid-list).
      expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled();

      await user.click(screen.getByRole('tab', { name: /^upvotes$/i }));

      // Filter swap snaps to page 1 of the filtered set — Previous disabled.
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getAllByText(/upvoted your post/i)).toHaveLength(10);
    });

    it('keeps the "Mark all read" pill scoped to all items, not just the filtered view', async () => {
      const user = userEvent.setup();
      // Only the (unread) upvote is unread; filtering to Replies still
      // shows the global unread pill because items overall has unread rows.
      const items: NotificationItem[] = [
        makeNotification({
          id: 'r1',
          kind: 'REPLY_TO_POST',
          readAt: new Date('2026-05-21T12:00:00Z'),
        }),
        makeNotification({ id: 'u1', kind: 'UPVOTE_POST', commentId: null }),
      ];
      render(<NotificationsList initialItems={items} />);

      await user.click(screen.getByRole('tab', { name: /^replies$/i }));

      // Filtered view shows the read reply only; pill still visible since
      // the underlying list has an unread upvote.
      expect(
        screen.getByRole('button', { name: /mark all read/i })
      ).toBeInTheDocument();
    });
  });
});
