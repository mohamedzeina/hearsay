import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaveButton from '@/components/posts/save-button';

const toggleSavedPostMock = vi.fn();
const useSessionMock = vi.fn();
const signInPromptOpenMock = vi.fn();
const toastShowMock = vi.fn();
const toastDismissMock = vi.fn();

vi.mock('@/actions', () => ({
  toggleSavedPost: (...args: unknown[]) => toggleSavedPostMock(...args),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('@/components/auth/signin-prompt', () => ({
  useSignInPrompt: () => ({ open: signInPromptOpenMock }),
}));

vi.mock('@/components/common/toast', () => ({
  useToast: () => ({ show: toastShowMock, dismiss: toastDismissMock }),
}));

describe('SaveButton', () => {
  beforeEach(() => {
    toggleSavedPostMock.mockReset();
    useSessionMock.mockReset();
    signInPromptOpenMock.mockReset();
    toastShowMock.mockReset();
    toastDismissMock.mockReset();
  });

  it('renders unsaved state with "Save post" label', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    render(<SaveButton postId="p1" initialSaved={false} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveAccessibleName('Save post');
  });

  it('renders saved state with "Unsave post" label', () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    render(<SaveButton postId="p1" initialSaved />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveAccessibleName('Unsave post');
  });

  it('opens signin prompt when unauthenticated, does not call action', async () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });
    const user = userEvent.setup();
    render(<SaveButton postId="p1" initialSaved={false} />);

    await user.click(screen.getByRole('button'));

    expect(signInPromptOpenMock).toHaveBeenCalledWith('Sign in to save posts.');
    expect(toggleSavedPostMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('optimistically toggles saved on click and calls toggleSavedPost', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleSavedPostMock.mockResolvedValue({ saved: true });
    const user = userEvent.setup();
    render(<SaveButton postId="p1" initialSaved={false} />);

    await user.click(screen.getByRole('button'));

    expect(toggleSavedPostMock).toHaveBeenCalledWith('p1');
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('rolls back on error', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleSavedPostMock.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<SaveButton postId="p1" initialSaved={false} />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('fires the save toast with /saved copy on save', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleSavedPostMock.mockResolvedValue({ saved: true });
    const user = userEvent.setup();
    render(<SaveButton postId="p1" initialSaved={false} />);

    await user.click(screen.getByRole('button'));

    expect(toastShowMock).toHaveBeenCalledTimes(1);
    const payload = toastShowMock.mock.calls[0][0];
    expect(payload.eyebrow).toMatch(/saved/i);
    expect(payload.body).toMatch(/\/saved/);
    expect(typeof payload.undo).toBe('function');
  });

  it('fires the unsave toast with removed-from-/saved copy on unsave', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleSavedPostMock.mockResolvedValue({ saved: false });
    const user = userEvent.setup();
    render(<SaveButton postId="p1" initialSaved />);

    await user.click(screen.getByRole('button'));

    expect(toastShowMock).toHaveBeenCalledTimes(1);
    const payload = toastShowMock.mock.calls[0][0];
    expect(payload.eyebrow).toMatch(/unsaved/i);
    expect(payload.body).toMatch(/removed from \/saved/i);
  });

  it('Undo callback re-toggles without showing a second toast', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleSavedPostMock.mockResolvedValue({ saved: true });
    const user = userEvent.setup();
    render(<SaveButton postId="p1" initialSaved={false} />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => expect(toggleSavedPostMock).toHaveBeenCalledTimes(1));
    const undo = toastShowMock.mock.calls[0][0].undo as () => void;

    // Reset for the second leg
    toastShowMock.mockClear();
    toggleSavedPostMock.mockResolvedValue({ saved: false });
    await act(async () => {
      undo();
    });

    await waitFor(() =>
      expect(toggleSavedPostMock).toHaveBeenCalledTimes(2)
    );
    expect(toastShowMock).not.toHaveBeenCalled();
  });

  it('dismisses the toast when the server rejects the toggle', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleSavedPostMock.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<SaveButton postId="p1" initialSaved={false} />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => expect(toastDismissMock).toHaveBeenCalled());
  });

  it('does not fire a toast when the user is not authenticated', async () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated' });
    const user = userEvent.setup();
    render(<SaveButton postId="p1" initialSaved={false} />);

    await user.click(screen.getByRole('button'));

    expect(toastShowMock).not.toHaveBeenCalled();
  });

  it('prevents click from navigating parent <Link>', async () => {
    useSessionMock.mockReturnValue({ status: 'authenticated' });
    toggleSavedPostMock.mockResolvedValue({ saved: true });
    const parentClick = vi.fn();
    const user = userEvent.setup();
    render(
      <div onClick={parentClick}>
        <SaveButton postId="p1" initialSaved={false} />
      </div>
    );

    await user.click(screen.getByRole('button'));

    expect(parentClick).not.toHaveBeenCalled();
  });
});
