import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopicCreateForm from '@/components/topics/topic-create-form';

const useSessionMock = vi.fn();
const signInPromptOpenMock = vi.fn();
const createTopicMock = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/components/auth/signin-prompt', () => ({
  useSignInPrompt: () => ({ open: signInPromptOpenMock }),
}));

vi.mock('@/actions', () => ({
  createTopic: (...args: unknown[]) => createTopicMock(...args),
}));

describe('TopicCreateForm trigger', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    signInPromptOpenMock.mockReset();
    createTopicMock.mockReset();
  });

  it('renders "Create a topic" button', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    render(<TopicCreateForm />);
    expect(
      screen.getByRole('button', { name: /create a topic/i })
    ).toBeInTheDocument();
  });

  it('opens signin prompt when unauthenticated', async () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });
    const user = userEvent.setup();
    render(<TopicCreateForm />);

    await user.click(screen.getByRole('button', { name: /create a topic/i }));

    expect(signInPromptOpenMock).toHaveBeenCalledWith(
      'Sign in to start a topic.'
    );
    expect(screen.queryByText(/start a topic/i)).not.toBeInTheDocument();
  });

  it('opens the create-topic modal when authenticated', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    const user = userEvent.setup();
    render(<TopicCreateForm />);

    await user.click(screen.getByRole('button', { name: /create a topic/i }));

    expect(await screen.findByText(/start a topic/i)).toBeInTheDocument();
    expect(signInPromptOpenMock).not.toHaveBeenCalled();
  });

  it('opens signin prompt while session is loading', async () => {
    useSessionMock.mockReturnValue({ status: 'loading' });
    const user = userEvent.setup();
    render(<TopicCreateForm />);

    await user.click(screen.getByRole('button', { name: /create a topic/i }));

    expect(signInPromptOpenMock).toHaveBeenCalled();
  });
});
