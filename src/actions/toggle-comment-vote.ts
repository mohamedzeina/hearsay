'use server';

import { redirect } from 'next/navigation';
import { db } from '@/db';
import { requireAuth } from '@/lib/server-utils';
import type { VoteResult } from './toggle-post-vote';

export async function toggleCommentVote(commentId: string): Promise<VoteResult> {
  const user = await requireAuth();
  if (!user) redirect('/auth/signin');

  return db.$transaction(async (tx) => {
    const existing = await tx.commentVote.findUnique({
      where: { userId_commentId: { userId: user.id, commentId } },
    });

    if (existing) {
      await tx.commentVote.delete({ where: { id: existing.id } });
    } else {
      await tx.commentVote.create({ data: { userId: user.id, commentId } });

      // Notify the comment author on a fresh upvote. Skip self-upvotes.
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { userId: true, postId: true },
      });
      if (comment && comment.userId !== user.id) {
        await tx.notification.create({
          data: {
            recipientId: comment.userId,
            actorId: user.id,
            kind: 'UPVOTE_COMMENT',
            postId: comment.postId,
            commentId,
          },
        });
      }
    }

    const count = await tx.commentVote.count({ where: { commentId } });
    return { voted: !existing, count };
  });
}
