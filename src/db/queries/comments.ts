import type { Comment } from '@prisma/client';
import { db } from '@/db';
import { cache } from 'react';
import { getViewerId } from '@/lib/server-utils';

export type CommentWithAuthor = Comment & {
  user: { name: string | null; image: string | null };
  _count: { votes: number };
  votes: { id: string }[];
};

export const fetchCommentsByPostId = cache(
  async (postId: string): Promise<CommentWithAuthor[]> => {
    const viewerId = await getViewerId();
    return db.comment.findMany({
      where: { postId },
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { votes: true } },
        votes: {
          where: { userId: viewerId ?? '' },
          select: { id: true },
          take: 1,
        },
      },
    });
  }
);
