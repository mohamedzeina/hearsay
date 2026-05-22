import { Prisma } from '@prisma/client';
import { db } from '@/db';
import { cache } from 'react';
import { getViewerId } from '@/lib/server-utils';

export function commentInclude(viewerId: string | null) {
  return {
    user: { select: { name: true, image: true, username: true } },
    _count: { select: { votes: true } },
    votes: {
      where: { userId: viewerId ?? '' },
      select: { id: true },
      take: 1,
    },
  } satisfies Prisma.CommentInclude;
}

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: ReturnType<typeof commentInclude>;
}>;

export const fetchCommentsByPostId = cache(
  async (postId: string): Promise<CommentWithAuthor[]> => {
    const viewerId = await getViewerId();
    return db.comment.findMany({
      where: { postId },
      include: commentInclude(viewerId),
      // Ascending so replies within a subtree read top-to-bottom in
      // posting order. The client re-sorts top-level branches via the
      // sort pill; nested replies keep this chronological flow.
      orderBy: { createdAt: 'asc' },
    });
  }
);
