import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import CommentShow from '@/components/comments/comment-show';
import type { CommentWithAuthor } from '@/db/queries/comments';

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated' }),
}));

vi.mock('@/components/auth/signin-prompt', () => ({
  useSignInPrompt: () => ({ open: vi.fn() }),
}));

vi.mock('@/actions', () => ({
  createComment: () => () => Promise.resolve(),
  deleteComment: vi.fn(),
  editComment: () => () => Promise.resolve(),
  toggleCommentVote: vi.fn(),
}));

function makeComment(
  id: string,
  parentId: string | null = null
): CommentWithAuthor {
  return {
    id,
    parentId,
    postId: 'p1',
    userId: 'u1',
    content: `body of ${id}`,
    createdAt: new Date('2026-05-20T12:00:00Z'),
    editedAt: null,
    deleted: false,
    user: { name: 'Alice', image: null },
    _count: { votes: 0 },
    votes: [],
  };
}

describe('CommentShow', () => {
  it('wraps every comment — including nested ones — in a permalink anchor', () => {
    const parent = makeComment('parent');
    const child = makeComment('child', 'parent');
    const grandchild = makeComment('grandchild', 'child');

    const childrenByParent = new Map<string | null, CommentWithAuthor[]>([
      ['parent', [child]],
      ['child', [grandchild]],
    ]);

    const { container } = render(
      <CommentShow
        comment={parent}
        childrenByParent={childrenByParent}
        currentUserId={null}
      />
    );

    expect(container.querySelector('#c-parent')).not.toBeNull();
    expect(container.querySelector('#c-child')).not.toBeNull();
    expect(container.querySelector('#c-grandchild')).not.toBeNull();
  });

  it('applies the scroll-mt and comment-anchor classes that drive the :target flash', () => {
    const comment = makeComment('only');
    const { container } = render(
      <CommentShow
        comment={comment}
        childrenByParent={new Map()}
        currentUserId={null}
      />
    );

    const anchor = container.querySelector('#c-only');
    expect(anchor).not.toBeNull();
    expect(anchor).toHaveClass('scroll-mt-24', 'comment-anchor');
  });
});
