'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import paths from '@/paths';
import type { ActionResult } from '@/lib/types';
import { formError, ok, requireUserOr } from '@/lib/actions';

export async function deletePost(postId: string): Promise<ActionResult> {
  const authed = await requireUserOr('You must be signed in to delete a post.');
  if (!authed.ok) return authed.result;

  const post = await db.post.findFirst({
    where: { id: postId },
    select: {
      userId: true,
      topic: { select: { slug: true } },
    },
  });
  if (!post) return formError('Post not found.');
  if (post.userId !== authed.user.id) {
    return formError('You can only delete your own posts.');
  }

  try {
    await db.post.delete({ where: { id: postId } });
  } catch (err) {
    console.error('deletePost failed', err);
    return formError('Failed to delete post. Please try again.');
  }

  revalidatePath(paths.topicShow(post.topic.slug));
  return ok({ redirectTo: paths.topicShow(post.topic.slug) });
}
