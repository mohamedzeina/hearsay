'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db';
import paths from '@/paths';
import type { ActionResult } from '@/lib/types';
import {
  formError,
  ok,
  parseFormData,
  requireUserOr,
} from '@/lib/actions';

const editCommentSchema = z.object({
  content: z.string().min(3),
});

const FIELDS = ['content'] as const;

export async function editComment(
  commentId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseFormData(editCommentSchema, formData, FIELDS);
  if (!parsed.ok) return parsed.result;

  const authed = await requireUserOr('You must be signed in to edit a comment.');
  if (!authed.ok) return authed.result;

  const comment = await db.comment.findFirst({
    where: { id: commentId },
    select: {
      userId: true,
      deleted: true,
      postId: true,
      post: { select: { topic: { select: { slug: true } } } },
    },
  });

  if (!comment) return formError('Comment not found.');
  if (comment.userId !== authed.user.id) {
    return formError('You can only edit your own comments.');
  }
  if (comment.deleted) return formError('This comment has been deleted.');

  try {
    await db.comment.update({
      where: { id: commentId },
      data: {
        content: parsed.data.content,
        editedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('editComment failed', err);
    return formError('Failed to save edit. Please try again.');
  }

  revalidatePath(paths.postShow(comment.post.topic.slug, comment.postId));
  return ok();
}
