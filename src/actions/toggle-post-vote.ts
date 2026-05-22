'use server';

import { redirect } from 'next/navigation';
import { db } from '@/db';
import { requireAuth } from '@/lib/server-utils';

export interface VoteResult {
  voted: boolean;
  count: number;
}

export async function togglePostVote(postId: string): Promise<VoteResult> {
  const user = await requireAuth();
  if (!user) redirect('/auth/signin');

  return db.$transaction(async (tx) => {
    const existing = await tx.postVote.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    if (existing) {
      await tx.postVote.delete({ where: { id: existing.id } });
    } else {
      await tx.postVote.create({ data: { userId: user.id, postId } });

      // Notify the post author on a fresh upvote. Skip self-upvotes.
      // Unvoting doesn't remove the historical notification — kept simple.
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { userId: true },
      });
      if (post && post.userId !== user.id) {
        await tx.notification.create({
          data: {
            recipientId: post.userId,
            actorId: user.id,
            kind: 'UPVOTE_POST',
            postId,
          },
        });
      }
    }

    const count = await tx.postVote.count({ where: { postId } });
    return { voted: !existing, count };
  });
}
