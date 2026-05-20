import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoteButton from '@/components/votes/vote-button';

const togglePostVoteMock = vi.fn();
const toggleCommentVoteMock = vi.fn();
const useSessionMock = vi.fn();
const signInPromptOpenMock = vi.fn();

vi.mock('@/actions', () => ({
  togglePostVote: (...args: unknown[]) => togglePostVoteMock(...args),
  toggleCommentVote: (...args: unknown[]) => toggleCommentVoteMock(...args),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('@/components/auth/signin-prompt', () => ({
  useSignInPrompt: () => ({ open: signInPromptOpenMock }),
}));

describe('VoteButton', () => {
  beforeEach(() => {
    togglePostVoteMock.mockReset();
    toggleCommentVoteMock.mockReset();
    useSessionMock.mockReset();
    signInPromptOpenMock.mockReset();
  });

  it('renders initial count and unvoted state', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    render(
      <VoteButton kind="post" id="p1" initialCount={5} initialVoted={false} />
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button')).toHaveAccessibleName('Upvote');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders voted state with "Remove upvote" label', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    render(<VoteButton kind="post" id="p1" initialCount={3} initialVoted />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button')).toHaveAccessibleName('Remove upvote');
  });

  it('opens signin prompt when unauthenticated, does not call action', async () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });
    const user = userEvent.setup();
    render(
      <VoteButton kind="post" id="p1" initialCount={5} initialVoted={false} />
    );

    await user.click(screen.getByRole('button'));

    expect(signInPromptOpenMock).toHaveBeenCalledWith('Sign in to upvote.');
    expect(togglePostVoteMock).not.toHaveBeenCalled();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('optimistically increments count and calls togglePostVote', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    togglePostVoteMock.mockResolvedValue({ voted: true, count: 6 });
    const user = userEvent.setup();
    render(
      <VoteButton kind="post" id="p1" initialCount={5} initialVoted={false} />
    );

    await user.click(screen.getByRole('button'));

    expect(togglePostVoteMock).toHaveBeenCalledWith('p1');
    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument();
    });
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('optimistically decrements when removing a vote', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    togglePostVoteMock.mockResolvedValue({ voted: false, count: 4 });
    const user = userEvent.setup();
    render(<VoteButton kind="post" id="p1" initialCount={5} initialVoted />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('rolls back on error', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    togglePostVoteMock.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(
      <VoteButton kind="post" id="p1" initialCount={5} initialVoted={false} />
    );

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls toggleCommentVote when kind is "comment"', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleCommentVoteMock.mockResolvedValue({ voted: true, count: 1 });
    const user = userEvent.setup();
    render(
      <VoteButton kind="comment" id="c1" initialCount={0} initialVoted={false} />
    );

    await user.click(screen.getByRole('button'));

    expect(toggleCommentVoteMock).toHaveBeenCalledWith('c1');
    expect(togglePostVoteMock).not.toHaveBeenCalled();
  });

  it('prevents click from navigating parent <Link>', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    togglePostVoteMock.mockResolvedValue({ voted: true, count: 1 });
    const parentClick = vi.fn();
    const user = userEvent.setup();
    render(
      <div onClick={parentClick}>
        <VoteButton kind="post" id="p1" initialCount={0} initialVoted={false} />
      </div>
    );

    await user.click(screen.getByRole('button'));

    expect(parentClick).not.toHaveBeenCalled();
  });
});
