"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/server-utils";
import { db } from "@/db";
import paths from "@/paths";
import type { FormState } from "@/lib/types";

const createCommentSchema = z.object({
  content: z.string().min(3),
});

export async function createComment(
  { postId, parentId }: { postId: string; parentId?: string },
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const result = createCommentSchema.safeParse({
    content: formData.get("content"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const user = await requireAuth();
  if (!user) {
    return { errors: { _form: ["You must sign in to do this."] } };
  }

  const post = await db.post.findFirst({
    where: { id: postId },
    select: { topic: { select: { slug: true } } },
  });

  if (!post) {
    return { errors: { _form: ["Post not found."] } };
  }

  try {
    await db.comment.create({
      data: {
        content: result.data.content,
        postId: postId,
        parentId: parentId,
        userId: user.id,
      },
    });
  } catch (err) {
    console.error("createComment failed", err);
    return {
      errors: { _form: ["Failed to post comment. Please try again."] },
    };
  }

  revalidatePath(paths.postShow(post.topic.slug, postId));
  return {
    errors: {},
    success: true,
  };
}
