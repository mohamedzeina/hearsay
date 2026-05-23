import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import PostCardList from '@/components/posts/post-card-list';
import {
  markVisited,
  VISITED_EVENT_NAME,
} from '@/lib/use-visited';
import type { PostWithData } from '@/db/queries/posts';

vi.mock('@/components/posts/post-card', () => ({
  default: ({ post }: { post: PostWithData }) => (
    <div data-testid="post" data-post-id={post.id}>
      {post.title}
    </div>
  ),
}));

function makePost(id: string, title: string): PostWithData {
  return {
    id,
    title,
    content: 'body',
    userId: 'u',
    topicId: 't',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    editedAt: null,
    user: { name: 'A', image: null, username: 'a' },
    topic: { slug: 't' },
    _count: { comments: 0, votes: 0 },
    votes: [],
    saves: [],
  } as PostWithData;
}

describe('PostCardList visited fade', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders unvisited cards at full opacity by default', () => {
    render(
      <PostCardList
        posts={[makePost('p1', 'first'), makePost('p2', 'second')]}
      />
    );

    const items = screen.getAllByRole('listitem');
    for (const li of items) {
      expect(li.className).toMatch(/opacity-100/);
      expect(li).not.toHaveAttribute('data-visited');
    }
  });

  it('fades cards that are already in the visited set on mount', async () => {
    markVisited('p1');

    render(
      <PostCardList
        posts={[makePost('p1', 'first'), makePost('p2', 'second')]}
      />
    );

    // The hook reads localStorage in an effect, so let React commit the
    // state update.
    await act(async () => {
      await Promise.resolve();
    });

    const items = screen.getAllByRole('listitem');
    const first = items[0];
    const second = items[1];

    expect(first).toHaveAttribute('data-visited', 'true');
    expect(first.className).toMatch(/opacity-60/);

    expect(second).not.toHaveAttribute('data-visited');
    expect(second.className).toMatch(/opacity-100/);
  });

  it('fades a card live when markVisited fires after the list is mounted', async () => {
    render(
      <PostCardList
        posts={[makePost('p1', 'first'), makePost('p2', 'second')]}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Both unvisited at this point.
    expect(screen.getAllByRole('listitem')[0]).not.toHaveAttribute(
      'data-visited'
    );

    await act(async () => {
      markVisited('p2');
      // Surface the dispatched window event to the hook subscriber.
      window.dispatchEvent(
        new CustomEvent(VISITED_EVENT_NAME, { detail: { postId: 'p2' } })
      );
    });

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('data-visited', 'true');
    expect(items[1].className).toMatch(/opacity-60/);
  });
});
