import { NextResponse } from 'next/server';
import {
  fetchRecentNotifications,
  fetchUnreadNotificationCount,
} from '@/db/queries/notifications';
import { getViewerId } from '@/lib/server-utils';

// Light polling endpoint for the header bell. Returns the same shape
// the server component normally hands to <NotificationsBell />, so the
// client can fold the response straight into its local state. Signed-
// out viewers get a 401 — the bell never renders without auth, but the
// guard keeps a curious caller from probing the route directly.
export async function GET() {
  const viewerId = await getViewerId();
  if (!viewerId) {
    return NextResponse.json({ items: [], unread: 0 }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    fetchRecentNotifications(viewerId),
    fetchUnreadNotificationCount(viewerId),
  ]);

  return NextResponse.json({ items, unread });
}
