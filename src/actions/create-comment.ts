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
import { COMMENT_CONTENT } from '@/lib/form-limits';
import { extractMentions } from '@/lib/mentions';

const createCommentSchema = z.object({
  content: z.string().min(COMMENT_CONTENT.min).max(COMMENT_CONTENT.max),
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
    select: {
      userId: true,
      topic: { select: { slug: true } },
    },
  });
  if (!post) return formError('Post not found.');

  // Resolve the recipient: nested reply → parent comment's author;
  // top-level comment → post author. Look up the parent author here so the
  // create transaction below has everything it needs.
  let recipientId: string | null = null;
  if (parentId) {
    const parent = await db.comment.findUnique({
      where: { id: parentId },
      select: { userId: true },
    });
    recipientId = parent?.userId ?? null;
  } else {
    recipientId = post.userId;
  }

  const mentioned = extractMentions(parsed.data.content);

  try {
    await db.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          content: parsed.data.content,
          postId,
          parentId,
          userId: authed.user.id,
        },
      });

      // Track recipients that have already been notified for this write so
      // a mention of the same user doesn't double-ping them.
      const notified = new Set<string>();

      // Skip self-replies: don't notify yourself when you reply to your
      // own post / comment. Skip if the parent author is somehow missing.
      if (recipientId && recipientId !== authed.user.id) {
        await tx.notification.create({
          data: {
            recipientId,
            actorId: authed.user.id,
            kind: parentId ? 'REPLY_TO_COMMENT' : 'REPLY_TO_POST',
            postId,
            commentId: comment.id,
          },
        });
        notified.add(recipientId);
      }

      if (mentioned.length > 0) {
        const users = await tx.user.findMany({
          where: {
            username: { in: mentioned },
            id: { not: authed.user.id },
          },
          select: { id: true },
        });
        const targets = users.filter((u) => !notified.has(u.id));
        if (targets.length > 0) {
          await tx.notification.createMany({
            data: targets.map((u) => ({
              recipientId: u.id,
              actorId: authed.user.id,
              kind: 'MENTION',
              postId,
              commentId: comment.id,
            })),
          });
        }
      }
    });
  } catch (err) {
    console.error('createComment failed', err);
    return formError('Failed to post comment. Please try again.');
  }

  revalidatePath(paths.postShow(post.topic.slug, postId));
  return ok();
}
