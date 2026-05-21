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

const createCommentSchema = z.object({
  content: z.string().min(3),
});

const FIELDS = ['content'] as const;

export async function createComment(
  { postId, parentId }: { postId: string; parentId?: string },
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseFormData(createCommentSchema, formData, FIELDS);
  if (!parsed.ok) return parsed.result;

  const authed = await requireUserOr('You must sign in to do this.');
  if (!authed.ok) return authed.result;

  const post = await db.post.findFirst({
    where: { id: postId },
    select: { topic: { select: { slug: true } } },
  });
  if (!post) return formError('Post not found.');

  try {
    await db.comment.create({
      data: {
        content: parsed.data.content,
        postId,
        parentId,
        userId: authed.user.id,
      },
    });
  } catch (err) {
    console.error('createComment failed', err);
    return formError('Failed to post comment. Please try again.');
  }

  revalidatePath(paths.postShow(post.topic.slug, postId));
  return ok();
}
