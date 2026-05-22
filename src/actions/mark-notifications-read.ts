'use server';

import { db } from '@/db';
import { requireAuth } from '@/lib/server-utils';

// Bulk-marks every unread notification for the viewer as read. Called
// from the bell when the dropdown opens. No-op if the viewer has no
// unread items or isn't signed in.
//
// The bell renders optimistically (badge clears immediately on open) so
// we don't need to revalidate any path — the next server render will
// pull readAt-stamped rows and produce a 0 count naturally.
export async function markNotificationsRead(): Promise<void> {
  const user = await requireAuth();
  if (!user) return;

  await db.notification.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
