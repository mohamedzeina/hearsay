import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopicCreateForm from '@/components/topics/topic-create-form';

const DRAFT_PREFIX = 'hearsay:draft:';

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
    window.localStorage.clear();
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

  it('restores saved name + description drafts when the modal opens', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    window.localStorage.setItem(DRAFT_PREFIX + 'topic:name', 'cooking-tips');
    window.localStorage.setItem(
      DRAFT_PREFIX + 'topic:description',
      'A place for kitchen wisdom.'
    );

    const user = userEvent.setup();
    render(<TopicCreateForm />);
    await user.click(screen.getByRole('button', { name: /create a topic/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^slug$/i)).toHaveValue('cooking-tips');
      expect(screen.getByLabelText(/^description$/i)).toHaveValue(
        'A place for kitchen wisdom.'
      );
    });
  });
});
