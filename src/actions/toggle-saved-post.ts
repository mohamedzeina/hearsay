'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { requireAuth } from '@/lib/server-utils';

export interface SaveResult {
  saved: boolean;
}

export async function toggleSavedPost(postId: string): Promise<SaveResult> {
  const user = await requireAuth();
  if (!user) redirect('/auth/signin');

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.savedPost.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    if (existing) {
      await tx.savedPost.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await tx.savedPost.create({ data: { userId: user.id, postId } });
    return { saved: true };
  });

  // The /saved route is cached per-user by the App Router; toggling here has
  // to invalidate it so a subsequent navigation doesn't show stale bookmarks.
  revalidatePath('/saved');
  return result;
}
