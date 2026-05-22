import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopicPostsEmpty from '@/components/posts/topic-posts-empty';

const routerPushMock = vi.fn();
const useSessionMock = vi.fn();
const signInPromptOpenMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('@/components/auth/signin-prompt', () => ({
  useSignInPrompt: () => ({ open: signInPromptOpenMock }),
}));

describe('TopicPostsEmpty', () => {
  beforeEach(() => {
    routerPushMock.mockReset();
    useSessionMock.mockReset();
    signInPromptOpenMock.mockReset();
  });

  it('renders the start-the-discussion headline with the topic slug', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    render(<TopicPostsEmpty slug="photography" />);

    expect(
      screen.getByRole('heading', { name: /start the discussion in #photography/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, el) =>
        /no posts in #photography yet/i.test(el?.textContent ?? '')
          && el?.tagName.toLowerCase() === 'p',
      )
    ).toBeInTheDocument();
  });

  it('embeds the Write a post CTA which navigates when authenticated', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    const user = userEvent.setup();
    render(<TopicPostsEmpty slug="photography" />);

    await user.click(screen.getByRole('button', { name: /write a post/i }));

    expect(routerPushMock).toHaveBeenCalledWith('/topics/photography/posts/new');
    expect(signInPromptOpenMock).not.toHaveBeenCalled();
  });

  it('opens the signin prompt when the CTA is clicked unauthenticated', async () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });
    const user = userEvent.setup();
    render(<TopicPostsEmpty slug="photography" />);

    await user.click(screen.getByRole('button', { name: /write a post/i }));

    expect(signInPromptOpenMock).toHaveBeenCalledWith('Sign in to start a post.');
    expect(routerPushMock).not.toHaveBeenCalled();
  });
});
