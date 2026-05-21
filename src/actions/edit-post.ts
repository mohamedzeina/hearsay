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

const editPostSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
});

const FIELDS = ['title', 'content'] as const;

export async function editPost(
  postId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseFormData(editPostSchema, formData, FIELDS);
  if (!parsed.ok) return parsed.result;

  const authed = await requireUserOr('You must be signed in to edit a post.');
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
    return formError('You can only edit your own posts.');
  }

  try {
    await db.post.update({
      where: { id: postId },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        editedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('editPost failed', err);
    return formError('Failed to save edit. Please try again.');
  }

  revalidatePath(paths.postShow(post.topic.slug, postId));
  return ok();
}
