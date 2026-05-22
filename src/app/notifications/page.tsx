import { redirect } from 'next/navigation';
import Breadcrumb from '@/components/common/breadcrumb';
import NotificationsList from '@/components/notifications/notifications-list';
import { fetchAllNotifications } from '@/db/queries/notifications';
import { requireAuth } from '@/lib/server-utils';
import paths from '@/paths';

export const metadata = {
  title: 'Notifications',
};

export default async function NotificationsPage() {
  const user = await requireAuth();
  if (!user) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(paths.notifications())}`
    );
  }

  const items = await fetchAllNotifications(user.id);

  return (
    <div className="py-8 sm:py-10">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Notifications' }]}
      />
      <NotificationsList initialItems={items} />
    </div>
  );
}
