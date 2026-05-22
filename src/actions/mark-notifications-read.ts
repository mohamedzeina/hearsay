'use server';

import { db } from '@/db';
import { requireAuth } from '@/lib/server-utils';

// Per-item mark-as-read. Called when the viewer clicks a notification
// in the bell dropdown. Scoped to the viewer in the where-clause so a
// guessed id from another account can't be flipped.
//
// The bell updates its local state optimistically; this just persists
// the change so the next server render reflects it.
export async function markNotificationRead(id: string): Promise<void> {
  const user = await requireAuth();
  if (!user) return;

  await db.notification.updateMany({
    where: { id, recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}

// Bulk mark-all-as-read for the viewer. Called from the explicit
// "Mark all read" pill in the bell header. Unbounded by design — it
// clears every unread row including ones beyond the 20-item dropdown
// recency window, which is the only escape hatch the bell offers for
// accumulated older unread until a dedicated /notifications page ships.
export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireAuth();
  if (!user) return;

  await db.notification.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
