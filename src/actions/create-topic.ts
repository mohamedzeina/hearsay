'use server';

import { z } from 'zod';
import { requireAuth } from '@/lib/server-utils';
import type { Topic } from '@prisma/client';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import paths from '@/paths';
import { revalidatePath } from 'next/cache';


const createTopicSchema = z.object({
  name: z.string().min(3).regex(/^[a-z-]+$/, { message: 'Must be lowercase letters or dashes without spaces' }),
  description: z.string().min(10),
});

import type { FormState } from '@/lib/types';

export async function createTopic(formState: FormState,
  formData: FormData): Promise<FormState> {


  const result = createTopicSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors
    }
  }

  const user = await requireAuth();
  if (!user) {
    return { errors: { _form: ['You must be signed in to create a topic'] } };
  }

  let topic: Topic;
  try {
    topic = await db.topic.create({
      data: {
        slug: result.data.name,
        description: result.data.description

      }
    })
  } catch (err: unknown) {
    console.error('createTopic failed', err);
    return {
      errors: {
        _form: ['Failed to create topic. The slug may already be taken.']
      }
    }
  }

  revalidatePath('/');
  redirect(paths.topicShow(topic.slug));

}
