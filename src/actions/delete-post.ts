"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import paths from "@/paths";
import { requireAuth } from "@/lib/server-utils";
import type { ActionResult } from "@/lib/types";

export async function deletePost(postId: string): Promise<ActionResult | void> {
  const user = await requireAuth();
  if (!user) return { error: "You must be signed in to delete a post." };

  const post = await db.post.findFirst({
    where: { id: postId },
    select: {
      userId: true,
      topic: { select: { slug: true } },
    },
  });

  if (!post) {
    return { error: "Post not found." };
  }

  if (post.userId !== user.id) {
    return { error: "You can only delete your own posts." };
  }

  await db.post.delete({ where: { id: postId } });

  redirect(paths.topicShow(post.topic.slug));
}
