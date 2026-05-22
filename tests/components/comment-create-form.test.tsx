import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentCreateForm from '@/components/comments/comment-create-form';

const DRAFT_PREFIX = 'hearsay:draft:';

const useSessionMock = vi.fn();
const signInPromptOpenMock = vi.fn();
const createCommentMock = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('@/components/auth/signin-prompt', () => ({
  useSignInPrompt: () => ({ open: signInPromptOpenMock }),
}));

vi.mock('@/actions', () => ({
  createComment: (..._args: unknown[]) => {
    // Action is `bind(null, ...)`-curried before being passed to useFormState.
    return (...rest: unknown[]) => createCommentMock(...rest);
  },
}));

describe('CommentCreateForm', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    signInPromptOpenMock.mockReset();
    createCommentMock.mockReset();
    window.localStorage.clear();
  });

  describe('top-level (startOpen=true)', () => {
    it('shows sign-in CTA instead of textarea when unauthenticated', () => {
      useSessionMock.mockReturnValue({ status: 'unauthenticated' });
      render(<CommentCreateForm postId="p1" startOpen />);
      expect(
        screen.getByRole('button', { name: /sign in to reply/i })
      ).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/share your thoughts/i)).not.toBeInTheDocument();
    });

    it('opens signin prompt when CTA clicked', async () => {
      useSessionMock.mockReturnValue({ status: 'unauthenticated' });
      const user = userEvent.setup();
      render(<CommentCreateForm postId="p1" startOpen />);

      await user.click(screen.getByRole('button', { name: /sign in to reply/i }));

      expect(signInPromptOpenMock).toHaveBeenCalledWith(
        'Sign in to join the discussion.'
      );
    });

    it('shows reply textarea when authenticated', () => {
      useSessionMock.mockReturnValue({ status: 'authenticated' });
      render(<CommentCreateForm postId="p1" startOpen />);
      expect(
        screen.getByPlaceholderText(/share your thoughts/i)
      ).toBeInTheDocument();
    });
  });

  describe('nested reply (startOpen undefined)', () => {
    it('renders a "Reply" button initially', () => {
      useSessionMock.mockReturnValue({ status: 'authenticated' });
      render(<CommentCreateForm postId="p1" parentId="c1" />);
      expect(
        screen.getByRole('button', { name: /^reply$/i })
      ).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/write a reply/i)).not.toBeInTheDocument();
    });

    it('opens reply form when authenticated and Reply clicked', async () => {
      useSessionMock.mockReturnValue({ status: 'authenticated' });
      const user = userEvent.setup();
      render(<CommentCreateForm postId="p1" parentId="c1" />);

      await user.click(screen.getByRole('button', { name: /^reply$/i }));

      expect(
        screen.getByPlaceholderText(/write a reply/i)
      ).toBeInTheDocument();
      expect(signInPromptOpenMock).not.toHaveBeenCalled();
    });

    it('opens signin prompt instead of form when unauthenticated', async () => {
      useSessionMock.mockReturnValue({ status: 'unauthenticated' });
      const user = userEvent.setup();
      render(<CommentCreateForm postId="p1" parentId="c1" />);

      await user.click(screen.getByRole('button', { name: /^reply$/i }));

      expect(signInPromptOpenMock).toHaveBeenCalledWith('Sign in to reply.');
      expect(screen.queryByPlaceholderText(/write a reply/i)).not.toBeInTheDocument();
    });

    it('cancel button closes the reply form', async () => {
      useSessionMock.mockReturnValue({ status: 'authenticated' });
      const user = userEvent.setup();
      render(<CommentCreateForm postId="p1" parentId="c1" />);

      await user.click(screen.getByRole('button', { name: /^reply$/i }));
      expect(screen.getByPlaceholderText(/write a reply/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /^cancel$/i }));
      expect(screen.queryByPlaceholderText(/write a reply/i)).not.toBeInTheDocument();
    });
  });

  describe('draft persistence', () => {
    it('restores a saved top-level comment draft on mount', async () => {
      useSessionMock.mockReturnValue({ status: 'authenticated' });
      window.localStorage.setItem(
        DRAFT_PREFIX + 'comment:p1',
        'half-written thought'
      );

      render(<CommentCreateForm postId="p1" startOpen />);

      const textarea = await screen.findByPlaceholderText(
        /share your thoughts/i
      );
      await waitFor(() =>
        expect(textarea).toHaveValue('half-written thought')
      );
    });

    it('persists typed top-level comment text to localStorage', async () => {
      useSessionMock.mockReturnValue({ status: 'authenticated' });
      const user = userEvent.setup();
      render(<CommentCreateForm postId="p1" startOpen />);

      const textarea = screen.getByPlaceholderText(/share your thoughts/i);
      await user.type(textarea, 'in progress');

      await waitFor(() =>
        expect(window.localStorage.getItem(DRAFT_PREFIX + 'comment:p1')).toBe(
          'in progress'
        )
      );
    });

    it('scopes drafts by parentId for nested replies', async () => {
      useSessionMock.mockReturnValue({ status: 'authenticated' });
      window.localStorage.setItem(
        DRAFT_PREFIX + 'reply:c1',
        'reply draft'
      );
      window.localStorage.setItem(
        DRAFT_PREFIX + 'comment:p1',
        'top-level draft'
      );

      const user = userEvent.setup();
      render(<CommentCreateForm postId="p1" parentId="c1" />);
      await user.click(screen.getByRole('button', { name: /^reply$/i }));

      const textarea = await screen.findByPlaceholderText(/write a reply/i);
      await waitFor(() => expect(textarea).toHaveValue('reply draft'));
    });
  });
});
