'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db';
import paths from '@/paths';
import { requireAuth } from '@/lib/server-utils';
import type { FormState } from '@/lib/types';

const editPostSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
});

export async function editPost(
  postId: string,
  formState: FormState,
  formData: FormData
): Promise<FormState> {
  const result = editPostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const user = await requireAuth();
  if (!user) {
    return { errors: { _form: ['You must be signed in to edit a post.'] } };
  }

  const post = await db.post.findFirst({
    where: { id: postId },
    select: {
      userId: true,
      topic: { select: { slug: true } },
    },
  });

  if (!post) {
    return { errors: { _form: ['Post not found.'] } };
  }

  if (post.userId !== user.id) {
    return { errors: { _form: ['You can only edit your own posts.'] } };
  }

  try {
    await db.post.update({
      where: { id: postId },
      data: {
        title: result.data.title,
        content: result.data.content,
        editedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('editPost failed', err);
    return {
      errors: { _form: ['Failed to save edit. Please try again.'] },
    };
  }

  revalidatePath(paths.postShow(post.topic.slug, postId));
  return { errors: {}, success: true };
}
