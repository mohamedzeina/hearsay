import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostCreateForm from '@/components/posts/post-create-form';

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

describe('PostCreateForm trigger', () => {
  beforeEach(() => {
    routerPushMock.mockReset();
    useSessionMock.mockReset();
    signInPromptOpenMock.mockReset();
  });

  it('renders "Write a post" button', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    render(<PostCreateForm slug="javascript" />);
    expect(
      screen.getByRole('button', { name: /write a post/i })
    ).toBeInTheDocument();
  });

  it('navigates to post-create page when authenticated', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    const user = userEvent.setup();
    render(<PostCreateForm slug="javascript" />);

    await user.click(screen.getByRole('button', { name: /write a post/i }));

    expect(routerPushMock).toHaveBeenCalledWith('/topics/javascript/posts/new');
    expect(signInPromptOpenMock).not.toHaveBeenCalled();
  });

  it('opens signin prompt when unauthenticated', async () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });
    const user = userEvent.setup();
    render(<PostCreateForm slug="javascript" />);

    await user.click(screen.getByRole('button', { name: /write a post/i }));

    expect(signInPromptOpenMock).toHaveBeenCalledWith('Sign in to start a post.');
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it('opens signin prompt while session is loading', async () => {
    useSessionMock.mockReturnValue({ status: 'loading' });
    const user = userEvent.setup();
    render(<PostCreateForm slug="javascript" />);

    await user.click(screen.getByRole('button', { name: /write a post/i }));

    expect(signInPromptOpenMock).toHaveBeenCalled();
    expect(routerPushMock).not.toHaveBeenCalled();
  });
});
