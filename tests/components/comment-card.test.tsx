import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentCard from '@/components/comments/comment-card';

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
