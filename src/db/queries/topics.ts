import { cache } from 'react';
import { db } from '@/db';
import { getViewerId } from '@/lib/server-utils';

export type TopicWithPostCount = {
  id: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { posts: number };
};

// Topic detail variant — adds viewer-scoped follow state so the
// FollowButton can render its initial value without a follow-up
// roundtrip. Empty `followers` array means the viewer is signed-out
// or doesn't follow; a one-element array means they do.
export type TopicWithFollowState = TopicWithPostCount & {
  followers: { id: string }[];
};

export const fetchTopicBySlug = cache(
  async (slug: string): Promise<TopicWithFollowState | null> => {
    const viewerId = await getViewerId();
    return db.topic.findUnique({
      where: { slug },
      include: {
        _count: { select: { posts: true } },
        followers: {
          where: { userId: viewerId ?? '' },
          select: { id: true },
          take: 1,
        },
      },
    });
  }
);

export function fetchAllTopicsByActivity(): Promise<TopicWithPostCount[]> {
  return db.topic.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { posts: { _count: 'desc' } },
  });
}

export type TopTopic = { id: string; slug: string };

export function fetchTopTopics(take: number): Promise<TopTopic[]> {
  return db.topic.findMany({
    take,
    orderBy: { posts: { _count: 'desc' } },
    select: { id: true, slug: true },
  });
}
