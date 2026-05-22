import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentListClient from '@/components/comments/comment-list-client';
import type { CommentWithAuthor } from '@/db/queries/comments';

// Mock the recursive CommentShow → a tiny stub that just prints the author
// name. We're testing the ordering and the sort pill, not the card.
vi.mock('@/components/comments/comment-show', () => ({
  default: ({ comment }: { comment: CommentWithAuthor }) => (
    <article data-testid="comment" data-id={comment.id}>
      {comment.user.name}
    </article>
  ),
}));

function makeComment(
  overrides: Partial<CommentWithAuthor> & { id: string }
): CommentWithAuthor {
  return {
    id: overrides.id,
    postId: 'p1',
    userId: 'u1',
    parentId: null,
    content: overrides.content ?? 'lorem',
    createdAt: overrides.createdAt ?? new Date('2026-05-22T12:00:00Z'),
    editedAt: null,
    deleted: false,
    user: {
      name: overrides.user?.name ?? overrides.id,
      image: null,
      username: null,
    },
    _count: { votes: overrides._count?.votes ?? 0 },
    votes: [],
    ...overrides,
  } as CommentWithAuthor;
}

const oldest = makeComment({
  id: 'a',
  createdAt: new Date('2026-05-20T10:00:00Z'),
  _count: { votes: 1 },
});
const middle = makeComment({
  id: 'b',
  createdAt: new Date('2026-05-21T10:00:00Z'),
  _count: { votes: 9 },
});
const newest = makeComment({
  id: 'c',
  createdAt: new Date('2026-05-22T10:00:00Z'),
  _count: { votes: 4 },
});

function renderedIds() {
  return screen
    .getAllByTestId('comment')
    .map((el) => el.getAttribute('data-id'));
}

describe('CommentListClient', () => {
  it('defaults to New (newest top-level comments first)', () => {
    render(
      <CommentListClient
        comments={[oldest, middle, newest]}
        currentUserId={null}
      />
    );

    expect(renderedIds()).toEqual(['c', 'b', 'a']);
    expect(
      screen.getByRole('tab', { name: /new/i, selected: true })
    ).toBeInTheDocument();
    expect(screen.getByText(/newest first/i)).toBeInTheDocument();
  });

  it('sorts by vote count when "top" is selected', async () => {
    const user = userEvent.setup();
    render(
      <CommentListClient
        comments={[oldest, middle, newest]}
        currentUserId={null}
      />
    );

    await user.click(screen.getByRole('tab', { name: /top/i }));

    // middle has 9 votes, newest has 4, oldest has 1
    expect(renderedIds()).toEqual(['b', 'c', 'a']);
    expect(screen.getByText(/most upvoted first/i)).toBeInTheDocument();
  });

  it('reverses to oldest-first when "old" is selected', async () => {
    const user = userEvent.setup();
    render(
      <CommentListClient
        comments={[oldest, middle, newest]}
        currentUserId={null}
      />
    );

    await user.click(screen.getByRole('tab', { name: /old/i }));

    expect(renderedIds()).toEqual(['a', 'b', 'c']);
    expect(screen.getByText(/oldest first/i)).toBeInTheDocument();
  });

  it('tie-breaks "top" by newest-first so ordering is stable', async () => {
    const user = userEvent.setup();
    const aTied = makeComment({
      id: 'tie-old',
      createdAt: new Date('2026-05-20T10:00:00Z'),
      _count: { votes: 5 },
    });
    const bTied = makeComment({
      id: 'tie-new',
      createdAt: new Date('2026-05-22T10:00:00Z'),
      _count: { votes: 5 },
    });

    render(
      <CommentListClient comments={[aTied, bTied]} currentUserId={null} />
    );
    await user.click(screen.getByRole('tab', { name: /top/i }));

    expect(renderedIds()).toEqual(['tie-new', 'tie-old']);
  });

  it('only reorders top-level comments — replies stay in their parent subtree', async () => {
    const user = userEvent.setup();
    const parent = makeComment({
      id: 'parent',
      createdAt: new Date('2026-05-20T10:00:00Z'),
      _count: { votes: 0 },
    });
    const reply = {
      ...makeComment({
        id: 'reply',
        createdAt: new Date('2026-05-22T10:00:00Z'),
        _count: { votes: 99 },
      }),
      parentId: 'parent',
    };
    const other = makeComment({
      id: 'other',
      createdAt: new Date('2026-05-21T10:00:00Z'),
      _count: { votes: 1 },
    });

    render(
      <CommentListClient
        comments={[parent, reply, other]}
        currentUserId={null}
      />
    );

    // "Top" sort would float the high-vote reply if it were treated as
    // top-level — verify it doesn't appear in the rendered top-level list.
    await user.click(screen.getByRole('tab', { name: /top/i }));
    expect(renderedIds()).toEqual(['other', 'parent']);
  });

  it('hides the sort pill and shows the empty-state when there are no replies', () => {
    render(<CommentListClient comments={[]} currentUserId={null} />);

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByText(/quiet in here/i)).toBeInTheDocument();
    expect(screen.getByText(/be the first to share/i)).toBeInTheDocument();
  });

  it('shows the active-reply count in the header, ignoring soft-deleted rows', () => {
    const deleted = { ...makeComment({ id: 'del' }), deleted: true };
    render(
      <CommentListClient
        comments={[oldest, middle, deleted]}
        currentUserId={null}
      />
    );

    const header = screen.getByRole('region', { name: /comments/i });
    expect(within(header).getByText(/^2 replies$/i)).toBeInTheDocument();
  });
});
