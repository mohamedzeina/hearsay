'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { requireAuth } from '@/lib/server-utils';

export interface FollowResult {
  followed: boolean;
}

// Toggle the viewer's TopicFollow row for the given topic. Wrapped in
// a $transaction so the find-then-delete-or-create can't race with a
// parallel click. The `@@unique([userId, topicId])` constraint also
// guards against duplicates at the DB level.
//
// Mirrors toggleSavedPost — same shape, same auth gate, same return
// value style. revalidates the home feed so the Following tab picks
// up the change without a hard reload.
export async function toggleTopicFollow(
  topicId: string
): Promise<FollowResult> {
  const user = await requireAuth();
  if (!user) redirect('/auth/signin');

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.topicFollow.findUnique({
      where: { userId_topicId: { userId: user.id, topicId } },
    });

    if (existing) {
      await tx.topicFollow.delete({ where: { id: existing.id } });
      return { followed: false };
    }

    await tx.topicFollow.create({
      data: { userId: user.id, topicId },
    });
    return { followed: true };
  });

  // Home page hosts the Following tab; revalidate so the next render
  // reflects the new follow state.
  revalidatePath('/');
  return result;
}
