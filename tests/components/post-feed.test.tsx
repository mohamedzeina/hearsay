import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostFeed from '@/components/posts/post-feed';
import type { PostWithData } from '@/db/queries/posts';

// PostCard reaches into the auth/router stack; stub it to a minimal
// stand-in so we can assert which posts the feed surfaces without
// rendering the full card chrome.
vi.mock('@/components/posts/post-card', () => ({
  // PostCardList wraps each item in <li> itself; rendering a <div>
  // here avoids the nested-li warning the stand-in would otherwise
  // trigger when React validates the list shape.
  default: ({ post }: { post: PostWithData }) => (
    <div data-testid="post" data-post-id={post.id}>
      {post.title}
    </div>
  ),
}));

function makePost(
  overrides: Partial<PostWithData> & { id: string; title: string }
): PostWithData {
  return {
    id: overrides.id,
    title: overrides.title,
    content: overrides.content ?? 'body',
    userId: 'u-author',
    topicId: 't-coffee',
    createdAt: overrides.createdAt ?? new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-05-01T00:00:00Z'),
    editedAt: null,
    user: {
      name: 'Author',
      image: null,
      username: 'author',
    },
    topic: { slug: 'coffee' },
    _count: {
      comments: 0,
      votes: overrides._count?.votes ?? 0,
    },
    votes: [],
    saves: [],
    ...overrides,
  } as PostWithData;
}

describe('PostFeed', () => {
  it('renders the Top and New sort tabs and nothing else', () => {
    render(<PostFeed posts={[makePost({ id: 'p1', title: 'Hello' })]} />);

    expect(screen.getByRole('tab', { name: /top/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /new/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /following/i })
    ).not.toBeInTheDocument();
  });

  it('orders posts by votes when Top is active (default)', () => {
    const posts = [
      makePost({
        id: 'old-popular',
        title: 'Old but popular',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        _count: { comments: 0, votes: 50 },
      }),
      makePost({
        id: 'new-quiet',
        title: 'New and quiet',
        createdAt: new Date('2026-05-01T00:00:00Z'),
        _count: { comments: 0, votes: 1 },
      }),
    ];
    render(<PostFeed posts={posts} />);

    const visible = screen.getAllByTestId('post');
    expect(visible[0]).toHaveTextContent('Old but popular');
  });

  it('switches to recency order when New is clicked', async () => {
    const user = userEvent.setup();
    const posts = [
      makePost({
        id: 'old-popular',
        title: 'Old but popular',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        _count: { comments: 0, votes: 50 },
      }),
      makePost({
        id: 'new-quiet',
        title: 'New and quiet',
        createdAt: new Date('2026-05-01T00:00:00Z'),
        _count: { comments: 0, votes: 1 },
      }),
    ];
    render(<PostFeed posts={posts} />);

    await user.click(screen.getByRole('tab', { name: /new/i }));
    const visible = screen.getAllByTestId('post');
    expect(visible[0]).toHaveTextContent('New and quiet');
  });

  it('honours defaultSort="new" by leading with the newest post', () => {
    const posts = [
      makePost({
        id: 'old-popular',
        title: 'Old but popular',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        _count: { comments: 0, votes: 50 },
      }),
      makePost({
        id: 'new-quiet',
        title: 'New and quiet',
        createdAt: new Date('2026-05-01T00:00:00Z'),
        _count: { comments: 0, votes: 1 },
      }),
    ];
    render(<PostFeed posts={posts} defaultSort="new" />);

    const visible = screen.getAllByTestId('post');
    expect(visible[0]).toHaveTextContent('New and quiet');
  });

  it('renders the supplied title and subtitle when provided', () => {
    render(
      <PostFeed
        posts={[makePost({ id: 'p1', title: 'Hello' })]}
        title="From topics you follow"
        subtitle="Scoped to your follows"
      />
    );

    expect(
      screen.getByRole('heading', { name: /from topics you follow/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/scoped to your follows/i)).toBeInTheDocument();
  });

  it('renders the supplied emptyState when posts is empty', () => {
    render(
      <PostFeed
        posts={[]}
        emptyState={<div data-testid="custom-empty">Nothing yet</div>}
      />
    );

    expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /top/i })).not.toBeInTheDocument();
  });

  it('falls back to the default empty card when no emptyState is given', () => {
    render(<PostFeed posts={[]} />);
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument();
  });
});
