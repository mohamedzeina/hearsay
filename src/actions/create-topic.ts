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

const createTopicSchema = z.object({
  name: z
    .string()
    .min(3)
    .regex(/^[a-z-]+$/, {
      message: 'Must be lowercase letters or dashes without spaces',
    }),
  description: z.string().min(10),
});

const FIELDS = ['name', 'description'] as const;

export async function createTopic(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseFormData(createTopicSchema, formData, FIELDS);
  if (!parsed.ok) return parsed.result;

  const authed = await requireUserOr('You must be signed in to create a topic.');
  if (!authed.ok) return authed.result;

  let slug: string;
  try {
    const topic = await db.topic.create({
      data: {
        slug: parsed.data.name,
        description: parsed.data.description,
      },
    });
    slug = topic.slug;
  } catch (err) {
    console.error('createTopic failed', err);
    return formError('Failed to create topic. The slug may already be taken.');
  }

  revalidatePath('/');
  return ok({ redirectTo: paths.topicShow(slug) });
}
