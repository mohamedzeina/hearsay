import { cache } from 'react';
import { Prisma } from '@prisma/client';
import { db } from '@/db';

const notificationInclude = {
  actor: { select: { name: true, image: true, username: true } },
  post: {
    select: {
      id: true,
      title: true,
      topic: { select: { slug: true } },
    },
  },
  comment: { select: { id: true } },
} satisfies Prisma.NotificationInclude;

export type NotificationItem = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

// Cap at 20 — anything older lives in history we haven't built yet.
// Refetched on every server render (header lives in the root layout) so
// the bell stays fresh without polling.
export const RECENT_NOTIFICATIONS_LIMIT = 20;

export const fetchRecentNotifications = cache(
  async (userId: string): Promise<NotificationItem[]> => {
    return db.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_NOTIFICATIONS_LIMIT,
      include: notificationInclude,
    });
  }
);

export const fetchUnreadNotificationCount = cache(
  async (userId: string): Promise<number> => {
    return db.notification.count({
      where: { recipientId: userId, readAt: null },
    });
  }
);
