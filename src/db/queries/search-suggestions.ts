import { db } from '@/db';

export interface SuggestionResult {
  topics: {
    id: string;
    slug: string;
    postCount: number;
  }[];
  posts: {
    id: string;
    title: string;
    topicSlug: string;
    replies: number;
  }[];
}

const MAX_TERM_LENGTH = 100;

export async function fetchSearchSuggestions(
  rawTerm: string
): Promise<SuggestionResult> {
  const term = rawTerm.trim().slice(0, MAX_TERM_LENGTH);
  if (term.length < 2) {
    return { topics: [], posts: [] };
  }

  const [topics, posts] = await Promise.all([
    db.topic.findMany({
      where: { slug: { contains: term, mode: 'insensitive' } },
      take: 4,
      orderBy: { posts: { _count: 'desc' } },
      include: { _count: { select: { posts: true } } },
    }),
    db.post.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { content: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        topic: { select: { slug: true } },
        _count: { select: { comments: { where: { deleted: false } } } },
      },
    }),
  ]);

  return {
    topics: topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      postCount: t._count.posts,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      topicSlug: p.topic.slug,
      replies: p._count.comments,
    })),
  };
}
