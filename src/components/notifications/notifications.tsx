import {
  fetchRecentNotifications,
  fetchUnreadNotificationCount,
} from '@/db/queries/notifications';
import { getViewerId } from '@/lib/server-utils';
import NotificationsBell from './notifications-bell';

// Server-side gate + data fetch for the header bell. Renders nothing for
// signed-out viewers so the UI stays focused on signin. Runs on every
// request because the header sits in the root layout; the two queries
// are cached via React `cache()` so they only execute once per render.
export default async function Notifications() {
  const viewerId = await getViewerId();
  if (!viewerId) return null;

  const [items, unread] = await Promise.all([
    fetchRecentNotifications(viewerId),
    fetchUnreadNotificationCount(viewerId),
  ]);

  return <NotificationsBell items={items} unread={unread} />;
}
