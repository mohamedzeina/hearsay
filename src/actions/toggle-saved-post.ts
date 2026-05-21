'use server';

import { redirect } from 'next/navigation';
import { db } from '@/db';
import { requireAuth } from '@/lib/server-utils';

export interface SaveResult {
  saved: boolean;
}

export async function toggleSavedPost(postId: string): Promise<SaveResult> {
  const user = await requireAuth();
  if (!user) redirect('/auth/signin');

  return db.$transaction(async (tx) => {
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
}
