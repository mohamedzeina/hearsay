import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FollowButton from '@/components/topics/follow-button';

const toggleTopicFollowMock = vi.fn();
const useSessionMock = vi.fn();
const signInPromptOpenMock = vi.fn();

vi.mock('@/actions', () => ({
  toggleTopicFollow: (...args: unknown[]) => toggleTopicFollowMock(...args),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('@/components/auth/signin-prompt', () => ({
  useSignInPrompt: () => ({ open: signInPromptOpenMock }),
}));

describe('FollowButton', () => {
  beforeEach(() => {
    toggleTopicFollowMock.mockReset();
    useSessionMock.mockReset();
    signInPromptOpenMock.mockReset();
  });

  it('renders not-followed state with Follow label', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    render(
      <FollowButton topicId="t1" topicSlug="coffee" initialFollowed={false} />
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveAccessibleName('Follow #coffee');
    expect(btn).toHaveTextContent(/^follow$/i);
  });

  it('renders followed state with Following label', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    render(
      <FollowButton topicId="t1" topicSlug="coffee" initialFollowed />
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveAccessibleName('Unfollow #coffee');
    expect(btn).toHaveTextContent(/following/i);
  });

  it('opens the signin modal when an unauthenticated user clicks', async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });
    render(
      <FollowButton topicId="t1" topicSlug="coffee" initialFollowed={false} />
    );

    await user.click(screen.getByRole('button'));

    expect(signInPromptOpenMock).toHaveBeenCalledWith(
      'Sign in to follow #coffee.'
    );
    expect(toggleTopicFollowMock).not.toHaveBeenCalled();
  });

  it('optimistically flips to Following on click and confirms via the action', async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleTopicFollowMock.mockResolvedValue({ followed: true });

    render(
      <FollowButton topicId="t1" topicSlug="coffee" initialFollowed={false} />
    );

    await user.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(toggleTopicFollowMock).toHaveBeenCalledWith('t1')
    );
    expect(screen.getByRole('button')).toHaveTextContent(/following/i);
  });

  it('reverts on server failure', async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleTopicFollowMock.mockRejectedValue(new Error('boom'));

    render(
      <FollowButton topicId="t1" topicSlug="coffee" initialFollowed={false} />
    );

    await user.click(screen.getByRole('button'));

    await waitFor(() => expect(toggleTopicFollowMock).toHaveBeenCalled());
    // The optimistic overlay snaps back to the server-confirmed state.
    expect(screen.getByRole('button')).toHaveTextContent(/^follow$/i);
  });
});
