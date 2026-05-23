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
  it('omits the Following tab when canFollow is false (signed-out)', () => {
    render(
      <PostFeed
        posts={[makePost({ id: 'p1', title: 'Hello' })]}
        canFollow={false}
      />
    );

    expect(screen.queryByRole('tab', { name: /following/i })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /top/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /new/i })).toBeInTheDocument();
  });

  it('renders the Following tab when canFollow is true', () => {
    render(
      <PostFeed
        posts={[makePost({ id: 'p1', title: 'Hello' })]}
        followingPosts={[makePost({ id: 'f1', title: 'Followed' })]}
        canFollow
      />
    );

    expect(screen.getByRole('tab', { name: /following/i })).toBeInTheDocument();
  });

  it('switches to followed posts when the Following tab is selected', async () => {
    const user = userEvent.setup();
    render(
      <PostFeed
        posts={[
          makePost({ id: 'all-1', title: 'All site post' }),
          makePost({ id: 'all-2', title: 'Another site post' }),
        ]}
        followingPosts={[makePost({ id: 'follow-1', title: 'From a follow' })]}
        canFollow
      />
    );

    // Default tab shows site-wide posts.
    expect(screen.getByText('All site post')).toBeInTheDocument();
    expect(screen.queryByText('From a follow')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /following/i }));

    expect(screen.getByText('From a follow')).toBeInTheDocument();
    expect(screen.queryByText('All site post')).not.toBeInTheDocument();
  });

  it('shows the empty state on the Following tab when there are no followed posts', async () => {
    const user = userEvent.setup();
    render(
      <PostFeed
        posts={[makePost({ id: 'all-1', title: 'All site post' })]}
        followingPosts={[]}
        canFollow
      />
    );

    await user.click(screen.getByRole('tab', { name: /following/i }));

    expect(
      screen.getByText(/nothing in your follows yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse topics/i })
    ).toBeInTheDocument();
  });

  it('still renders the top/new sort tabs and orders posts by votes vs createdAt', async () => {
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
    render(<PostFeed posts={posts} canFollow={false} />);

    // Default is top — old-popular leads.
    const visibleTop = screen.getAllByTestId('post');
    expect(visibleTop[0]).toHaveTextContent('Old but popular');

    await user.click(screen.getByRole('tab', { name: /new/i }));
    const visibleNew = screen.getAllByTestId('post');
    expect(visibleNew[0]).toHaveTextContent('New and quiet');
  });
});
