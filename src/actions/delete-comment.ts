'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import paths from '@/paths';
import type { ActionResult } from '@/lib/types';
import { formError, ok, requireUserOr } from '@/lib/actions';

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const authed = await requireUserOr('You must be signed in to delete a comment.');
  if (!authed.ok) return authed.result;

  const comment = await db.comment.findFirst({
    where: { id: commentId },
    select: {
      userId: true,
      postId: true,
      _count: { select: { children: true } },
      post: { select: { topic: { select: { slug: true } } } },
    },
  });

  if (!comment) return formError('Comment not found.');
  if (comment.userId !== authed.user.id) {
    return formError('You can only delete your own comments.');
  }

  try {
    if (comment._count.children > 0) {
      await db.comment.update({
        where: { id: commentId },
        data: { deleted: true },
      });
    } else {
      await db.comment.delete({ where: { id: commentId } });
    }
  } catch (err) {
    console.error('deleteComment failed', err);
    return formError('Failed to delete comment. Please try again.');
  }

  revalidatePath(paths.postShow(comment.post.topic.slug, comment.postId));
  return ok();
}
