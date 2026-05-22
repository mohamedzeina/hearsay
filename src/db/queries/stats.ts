import { cache } from 'react';
import { db } from '@/db';

export type SiteStats = {
  postCount: number;
  topicCount: number;
  userCount: number;
};

export const fetchSiteStats = cache(async (): Promise<SiteStats> => {
  const [postCount, topicCount, userCount] = await Promise.all([
    db.post.count(),
    db.topic.count(),
    db.user.count(),
  ]);
  return { postCount, topicCount, userCount };
});
