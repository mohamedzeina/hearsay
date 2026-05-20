'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db';
import paths from '@/paths';
import { requireAuth } from '@/lib/server-utils';
import type { FormState } from '@/lib/types';

const editCommentSchema = z.object({
  content: z.string().min(3),
});

export async function editComment(
  commentId: string,
  formState: FormState,
  formData: FormData
): Promise<FormState> {
  const result = editCommentSchema.safeParse({
    content: formData.get('content'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const user = await requireAuth();
  if (!user) {
    return { errors: { _form: ['You must be signed in to edit a comment.'] } };
  }

  const comment = await db.comment.findFirst({
    where: { id: commentId },
    select: {
      userId: true,
      deleted: true,
      postId: true,
      post: { select: { topic: { select: { slug: true } } } },
    },
  });

  if (!comment) {
    return { errors: { _form: ['Comment not found.'] } };
  }

  if (comment.userId !== user.id) {
    return { errors: { _form: ['You can only edit your own comments.'] } };
  }

  if (comment.deleted) {
    return { errors: { _form: ['This comment has been deleted.'] } };
  }

  try {
    await db.comment.update({
      where: { id: commentId },
      data: {
        content: result.data.content,
        editedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('editComment failed', err);
    return {
      errors: { _form: ['Failed to save edit. Please try again.'] },
    };
  }

  revalidatePath(paths.postShow(comment.post.topic.slug, comment.postId));
  return { errors: {}, success: true };
}
