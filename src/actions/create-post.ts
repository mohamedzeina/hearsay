'use server';

import { db } from '@/db'
import type { Post } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAuth } from '@/lib/server-utils'
import paths from '@/paths'
import type { FormState } from '@/lib/types'

const createPostSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10)
});

export async function createPost(
  slug: string,
  formState: FormState,
  formData: FormData):
  Promise<FormState> {

  const result = createPostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content')
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors
    }
  }

  const user = await requireAuth();
  if (!user) {
    return { errors: { _form: ['You must be signed in to create a post'] } };
  }

  const topic = await db.topic.findFirst({
    where: { slug }
  });

  if (!topic) {
    return {
      errors: {
        _form: ['Cannot find topic'],
      }
    }
  }

  let post: Post;
  try {

    post = await db.post.create({
      data: {
        title: result.data.title,
        content: result.data.content,
        userId: user.id,
        topicId: topic.id
      }
    })
  } catch (err: unknown) {
    console.error('createPost failed', err);
    return {
      errors: {
        _form: ['Failed to create post. Please try again.']
      }
    }
  }
  revalidatePath(paths.topicShow(slug));
  redirect(paths.postShow(slug, post.id));
}