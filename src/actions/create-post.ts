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
import { POST_CONTENT, POST_TITLE } from '@/lib/form-limits';
import { extractMentions } from '@/lib/mentions';

const createPostSchema = z.object({
  title: z.string().min(POST_TITLE.min).max(POST_TITLE.max),
  content: z.string().min(POST_CONTENT.min).max(POST_CONTENT.max),
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

  const mentioned = extractMentions(parsed.data.content);

  let postId: string;
  try {
    postId = await db.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          title: parsed.data.title,
          content: parsed.data.content,
          userId: authed.user.id,
          topicId: topic.id,
        },
      });

      if (mentioned.length > 0) {
        const users = await tx.user.findMany({
          where: {
            username: { in: mentioned },
            id: { not: authed.user.id },
          },
          select: { id: true },
        });
        if (users.length > 0) {
          await tx.notification.createMany({
            data: users.map((u) => ({
              recipientId: u.id,
              actorId: authed.user.id,
              kind: 'MENTION',
              postId: post.id,
            })),
          });
        }
      }

      return post.id;
    });
  } catch (err) {
    console.error('createPost failed', err);
    return formError('Failed to create post. Please try again.');
  }

  revalidatePath(paths.topicShow(slug));
  return ok({ redirectTo: paths.postShow(slug, postId) });
}
