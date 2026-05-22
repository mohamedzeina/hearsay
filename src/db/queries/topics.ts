import { cache } from 'react';
import { db } from '@/db';

export type TopicWithPostCount = {
  id: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { posts: number };
};

export const fetchTopicBySlug = cache(
  (slug: string): Promise<TopicWithPostCount | null> =>
    db.topic.findUnique({
      where: { slug },
      include: { _count: { select: { posts: true } } },
    })
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
