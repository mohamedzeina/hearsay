import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScopedPostFeed from '@/components/feed-nav/scoped-post-feed';
import FeedNav from '@/components/feed-nav/feed-nav';
import {
  ScopeProvider,
  type Scope,
} from '@/components/feed-nav/scope-provider';
import type { PostWithData } from '@/db/queries/posts';

vi.mock('@/components/posts/post-card', () => ({
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
    user: { name: 'Author', image: null, username: 'author' },
    topic: { slug: 'coffee' },
    _count: { comments: 0, votes: overrides._count?.votes ?? 0 },
    votes: [],
    saves: [],
    ...overrides,
  } as PostWithData;
}

function renderWith(
  initial: Scope,
  ui: React.ReactNode = <ScopedPostFeed everywherePosts={EVERYWHERE} followingPosts={FOLLOWING} />
) {
  return render(
    <ScopeProvider initialScope={initial} canFollow>
      {ui}
    </ScopeProvider>
  );
}

const EVERYWHERE = [
  makePost({ id: 'all-1', title: 'Everywhere post' }),
];
const FOLLOWING = [
  makePost({ id: 'fol-1', title: 'Followed post' }),
];

describe('ScopedPostFeed', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('renders the everywhere feed when scope is "everywhere"', () => {
    renderWith('everywhere');
    expect(screen.getByText('Everywhere post')).toBeInTheDocument();
    expect(screen.queryByText('Followed post')).not.toBeInTheDocument();
  });

  it('renders the following feed when scope is "following"', () => {
    renderWith('following');
    expect(screen.getByText('Followed post')).toBeInTheDocument();
    expect(screen.queryByText('Everywhere post')).not.toBeInTheDocument();
  });

  it('swaps to the following feed instantly when the user clicks the nav', async () => {
    const user = userEvent.setup();
    renderWith(
      'everywhere',
      <>
        <FeedNav />
        <ScopedPostFeed everywherePosts={EVERYWHERE} followingPosts={FOLLOWING} />
      </>
    );

    expect(screen.getByText('Everywhere post')).toBeInTheDocument();
    expect(screen.queryByText('Followed post')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /following/i }));

    // No server roundtrip — the followed post should be in the DOM synchronously after the click.
    expect(screen.getByText('Followed post')).toBeInTheDocument();
    expect(screen.queryByText('Everywhere post')).not.toBeInTheDocument();
  });

  it('renders the Following empty state when the followed feed is empty', () => {
    render(
      <ScopeProvider initialScope="following" canFollow>
        <ScopedPostFeed everywherePosts={EVERYWHERE} followingPosts={[]} />
      </ScopeProvider>
    );

    expect(
      screen.getByText(/nothing in your follows yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse topics/i })
    ).toBeInTheDocument();
  });

  it('uses the Following-scoped header copy', () => {
    renderWith('following');
    expect(
      screen.getByRole('heading', { name: /from topics you follow/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/scoped to your follows/i)).toBeInTheDocument();
  });

  it('keeps the active sort sticky when the viewer switches scopes', async () => {
    const user = userEvent.setup();
    renderWith(
      'everywhere',
      <>
        <FeedNav />
        <ScopedPostFeed everywherePosts={EVERYWHERE} followingPosts={FOLLOWING} />
      </>
    );

    // Default is Top; flip to New on the Everywhere feed first.
    await user.click(screen.getByRole('tab', { name: /new/i }));
    expect(screen.getByRole('tab', { name: /new/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Switch scope. New should remain the active sort — not snap back to Top.
    await user.click(screen.getByRole('button', { name: /following/i }));
    expect(screen.getByRole('tab', { name: /new/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: /top/i })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });
});
