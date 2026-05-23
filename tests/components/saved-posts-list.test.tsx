import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SavedPostsList from '@/components/posts/saved-posts-list';
import type { PostWithData } from '@/db/queries/posts';

const toggleSavedPostMock = vi.fn();
const useSessionMock = vi.fn();
const toastShowMock = vi.fn();
const toastDismissMock = vi.fn();

vi.mock('@/actions', () => ({
  toggleSavedPost: (...args: unknown[]) => toggleSavedPostMock(...args),
  togglePostVote: vi.fn(),
  toggleCommentVote: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/auth/signin-prompt', () => ({
  useSignInPrompt: () => ({ open: vi.fn() }),
}));

vi.mock('@/components/common/toast', () => ({
  useToast: () => ({ show: toastShowMock, dismiss: toastDismissMock }),
}));

function makePost(overrides: Partial<PostWithData>): PostWithData {
  return {
    id: 'p1',
    title: 'A saved post',
    content: 'body',
    userId: 'u1',
    topicId: 't1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    editedAt: null,
    topic: { slug: 'general' },
    user: { name: 'Author', image: null, username: 'author' },
    _count: { comments: 0, votes: 0 },
    votes: [],
    saves: [{ id: 's1' }],
    ...overrides,
  } as PostWithData;
}

describe('SavedPostsList', () => {
  beforeEach(() => {
    toggleSavedPostMock.mockReset();
    useSessionMock.mockReset();
    toastShowMock.mockReset();
    toastDismissMock.mockReset();
    useSessionMock.mockReturnValue({ status: 'authenticated' });
  });

  it('renders the empty state when initialPosts is empty', () => {
    render(<SavedPostsList initialPosts={[]} />);
    expect(screen.getByText('Nothing saved yet')).toBeInTheDocument();
    expect(screen.queryByText('Newest save first')).not.toBeInTheDocument();
  });

  it('renders the populated header and a card per post', () => {
    render(
      <SavedPostsList
        initialPosts={[
          makePost({ id: 'p1', title: 'first' }),
          makePost({ id: 'p2', title: 'second' }),
        ]}
      />
    );
    expect(screen.getByText('Newest save first')).toBeInTheDocument();
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('drops a card after the bookmark is toggled off, and falls through to the empty state when the last one goes', async () => {
    toggleSavedPostMock.mockResolvedValue({ saved: false });
    const user = userEvent.setup();
    render(
      <SavedPostsList initialPosts={[makePost({ id: 'p1', title: 'only post' })]} />
    );

    // Sanity: the card is on-screen, empty state is not.
    expect(screen.getByText('only post')).toBeInTheDocument();
    expect(screen.queryByText('Nothing saved yet')).not.toBeInTheDocument();

    // Find this card's "Unsave" bookmark (initialSaved = true because saves: [{ id }]).
    const unsaveBtn = screen.getByRole('button', { name: 'Unsave post' });
    await user.click(unsaveBtn);

    await waitFor(() => {
      expect(screen.queryByText('only post')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Nothing saved yet')).toBeInTheDocument();
    expect(screen.queryByText('Newest save first')).not.toBeInTheDocument();
  });

  it('restores the card when the toast Undo callback fires (was the last card)', async () => {
    toggleSavedPostMock.mockResolvedValue({ saved: false });
    const user = userEvent.setup();
    render(
      <SavedPostsList
        initialPosts={[makePost({ id: 'p1', title: 'only post' })]}
      />
    );

    // Click unsave — card drops, empty state shows.
    await user.click(screen.getByRole('button', { name: 'Unsave post' }));
    await waitFor(() => {
      expect(screen.queryByText('only post')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Nothing saved yet')).toBeInTheDocument();

    // The unsave call also pushed an Undo callback into the toast.
    expect(toastShowMock).toHaveBeenCalled();
    const lastCall = toastShowMock.mock.calls.at(-1);
    const undo = lastCall?.[0]?.undo as (() => void) | undefined;
    expect(typeof undo).toBe('function');

    // Reset for the second leg (toggleSavedPost will be called again).
    toggleSavedPostMock.mockResolvedValue({ saved: true });

    // Fire undo — the card should be back in the same frame.
    await act(async () => {
      undo!();
    });

    expect(screen.getByText('only post')).toBeInTheDocument();
    expect(screen.queryByText('Nothing saved yet')).not.toBeInTheDocument();
  });

  it('restores the card at its original index when one of several is unsaved + undone', async () => {
    toggleSavedPostMock.mockResolvedValue({ saved: false });
    const user = userEvent.setup();
    render(
      <SavedPostsList
        initialPosts={[
          makePost({ id: 'p1', title: 'first' }),
          makePost({ id: 'p2', title: 'middle' }),
          makePost({ id: 'p3', title: 'last' }),
        ]}
      />
    );

    // Unsave the middle card.
    const middleCard = screen.getByText('middle').closest('li');
    expect(middleCard).not.toBeNull();
    const unsaveBtn = within(middleCard as HTMLElement).getByRole('button', {
      name: 'Unsave post',
    });
    await user.click(unsaveBtn);

    await waitFor(() => {
      expect(screen.queryByText('middle')).not.toBeInTheDocument();
    });

    const undo = toastShowMock.mock.calls.at(-1)?.[0]?.undo as () => void;
    toggleSavedPostMock.mockResolvedValue({ saved: true });

    await act(async () => {
      undo();
    });

    // Card is back, at the same index between first and last.
    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(['first', 'middle', 'last']);
  });

  it('keeps other cards when one is unsaved', async () => {
    toggleSavedPostMock.mockResolvedValue({ saved: false });
    const user = userEvent.setup();
    render(
      <SavedPostsList
        initialPosts={[
          makePost({ id: 'p1', title: 'keep me' }),
          makePost({ id: 'p2', title: 'drop me' }),
        ]}
      />
    );

    const dropCard = screen.getByText('drop me').closest('li');
    expect(dropCard).not.toBeNull();
    const unsaveBtn = within(dropCard as HTMLElement).getByRole('button', {
      name: 'Unsave post',
    });
    await user.click(unsaveBtn);

    await waitFor(() => {
      expect(screen.queryByText('drop me')).not.toBeInTheDocument();
    });
    expect(screen.getByText('keep me')).toBeInTheDocument();
    expect(screen.getByText('Newest save first')).toBeInTheDocument();
  });
});
