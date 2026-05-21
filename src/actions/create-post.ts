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

const createPostSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
});

const FIELDS = ['title', 'content'] as const;

export async function createPost(
  slug: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseFormData(createPostSchema, formData, FIELDS);
  if (!parsed.ok) return parsed.result;

  const authed = await requireUserOr('You must be signed in to create a post.');
  if (!authed.ok) return authed.result;

  const topic = await db.topic.findFirst({ where: { slug } });
  if (!topic) return formError('Cannot find topic.');

  let postId: string;
  try {
    const post = await db.post.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        userId: authed.user.id,
        topicId: topic.id,
      },
    });
    postId = post.id;
  } catch (err) {
    console.error('createPost failed', err);
    return formError('Failed to create post. Please try again.');
  }

  revalidatePath(paths.topicShow(slug));
  return ok({ redirectTo: paths.postShow(slug, postId) });
}
