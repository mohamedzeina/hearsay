import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentCard from '@/components/comments/comment-card';
import { deleteComment } from '@/actions';

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated' }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/components/auth/signin-prompt', () => ({
  useSignInPrompt: () => ({ open: vi.fn() }),
}));

vi.mock('@/actions', () => ({
  createComment: () => () => Promise.resolve(),
  deleteComment: vi.fn(),
  editComment: () => () => Promise.resolve(),
  toggleCommentVote: vi.fn().mockResolvedValue({ voted: true, count: 1 }),
}));

const baseComment = {
  id: 'c123',
  postId: 'p1',
  userId: 'u1',
  content: 'hello world',
  createdAt: new Date('2026-05-20T12:00:00Z'),
  editedAt: null,
  deleted: false,
  user: { name: 'Alice', image: null },
  _count: { votes: 2 },
  votes: [],
};

beforeEach(() => {
  // userEvent.setup() installs its own jsdom clipboard, so each test spies on
  // navigator.clipboard.writeText *after* setup. Stub location once here.
  Object.defineProperty(window, 'location', {
    value: new URL('https://hearsay.test/topics/js/posts/p1'),
    configurable: true,
    writable: true,
  });
});

describe('CommentCard copy-link button', () => {
  it('renders for any viewer, including non-owners', () => {
    render(
      <CommentCard
        comment={baseComment}
        isOwner={false}
        hasReplies={false}
      />
    );
    expect(
      screen.getByRole('button', { name: /copy link to this comment/i })
    ).toBeInTheDocument();
  });

  it('writes <post-url>#c-{id} to the clipboard on click', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    render(
      <CommentCard
        comment={baseComment}
        isOwner={false}
        hasReplies={false}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /copy link to this comment/i })
    );

    expect(writeTextSpy).toHaveBeenCalledWith(
      'https://hearsay.test/topics/js/posts/p1#c-c123'
    );
  });

  it('briefly shows "Copied" after a successful copy', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    render(
      <CommentCard
        comment={baseComment}
        isOwner={false}
        hasReplies={false}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /copy link to this comment/i })
    );

    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('still renders Edit and Delete controls for the owner', () => {
    render(
      <CommentCard
        comment={baseComment}
        isOwner={true}
        hasReplies={false}
      />
    );
    expect(
      screen.getByRole('button', { name: /copy link to this comment/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete/i })
    ).toBeInTheDocument();
  });

  it('does not render the link button on a deleted comment', () => {
    render(
      <CommentCard
        comment={{ ...baseComment, deleted: true }}
        isOwner={false}
        hasReplies={true}
      />
    );
    expect(
      screen.queryByRole('button', { name: /copy link to this comment/i })
    ).not.toBeInTheDocument();
  });

  it('swallows clipboard errors without flashing "Copied"', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('denied'));

    render(
      <CommentCard
        comment={baseComment}
        isOwner={false}
        hasReplies={false}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /copy link to this comment/i })
    );

    expect(writeTextSpy).toHaveBeenCalled();
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });
});

describe('CommentCard lifecycle', () => {
  it('renders a gravestone when comment.deleted is true and there are replies', () => {
    render(
      <CommentCard
        comment={{ ...baseComment, deleted: true }}
        isOwner={false}
        hasReplies={true}
      >
        <div data-testid="thread-child">reply</div>
      </CommentCard>
    );
    expect(screen.getByText(/comment deleted/i)).toBeInTheDocument();
    expect(screen.getByTestId('thread-child')).toBeInTheDocument();
    // No author or vote controls should leak through.
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /upvote/i })
    ).not.toBeInTheDocument();
  });

  it('soft-deletes (gravestone) when the owner deletes a comment with replies', async () => {
    vi.mocked(deleteComment).mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(
      <CommentCard comment={baseComment} isOwner={true} hasReplies={true}>
        <div data-testid="thread-child">reply</div>
      </CommentCard>
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /^yes$/i }));

    await waitFor(() => {
      expect(screen.getByText(/comment deleted/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId('thread-child')).toBeInTheDocument();
    expect(screen.queryByText('hello world')).not.toBeInTheDocument();
  });

  it('hides the card entirely when the owner deletes a leaf comment (no replies)', async () => {
    vi.mocked(deleteComment).mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    const { container } = render(
      <CommentCard comment={baseComment} isOwner={true} hasReplies={false} />
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /^yes$/i }));

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});

describe('CommentCard edit toggle', () => {
  it('shows the edit form when Edit is clicked and hides actions/content', async () => {
    const user = userEvent.setup();
    render(
      <CommentCard comment={baseComment} isOwner={true} hasReplies={false} />
    );

    expect(screen.getByText('hello world')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    expect(
      screen.getByRole('button', { name: /^save$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^cancel$/i })
    ).toBeInTheDocument();
    // Live-view-only controls (copy link, vote, reply) should disappear.
    expect(
      screen.queryByRole('button', { name: /copy link to this comment/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /upvote/i })
    ).not.toBeInTheDocument();
  });

  it('restores the live view when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CommentCard comment={baseComment} isOwner={true} hasReplies={false} />
    );

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
  });
});

describe('CommentCard collapse rail', () => {
  it('hides children and shows "+ show replies" when the rail is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CommentCard
        comment={baseComment}
        isOwner={false}
        hasReplies={true}
      >
        <div data-testid="thread-child">reply</div>
      </CommentCard>
    );

    expect(screen.getByTestId('thread-child')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /collapse replies/i })
    );

    expect(screen.queryByTestId('thread-child')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show replies/i })
    ).toBeInTheDocument();
  });

  it('re-expands children when "+ show replies" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CommentCard
        comment={baseComment}
        isOwner={false}
        hasReplies={true}
      >
        <div data-testid="thread-child">reply</div>
      </CommentCard>
    );

    await user.click(
      screen.getByRole('button', { name: /collapse replies/i })
    );
    await user.click(screen.getByRole('button', { name: /show replies/i }));

    expect(screen.getByTestId('thread-child')).toBeInTheDocument();
  });

  it('does not render the collapse rail when there are no children', () => {
    render(
      <CommentCard
        comment={baseComment}
        isOwner={false}
        hasReplies={false}
      />
    );
    expect(
      screen.queryByRole('button', { name: /collapse replies/i })
    ).not.toBeInTheDocument();
  });
});

describe('CommentCard edited indicator', () => {
  it('shows "edited X ago" when editedAt is present', () => {
    render(
      <CommentCard
        comment={{ ...baseComment, editedAt: new Date('2026-05-20T13:00:00Z') }}
        isOwner={false}
        hasReplies={false}
      />
    );
    expect(screen.getByText(/^edited /i)).toBeInTheDocument();
  });

  it('does not show the edited indicator when editedAt is null', () => {
    render(
      <CommentCard
        comment={baseComment}
        isOwner={false}
        hasReplies={false}
      />
    );
    expect(screen.queryByText(/^edited /i)).not.toBeInTheDocument();
  });
});
