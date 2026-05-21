import { db } from '@/db';
import type { PostWithData } from '@/db/queries/posts';

export async function fetchSavedPosts(userId: string): Promise<PostWithData[]> {
  const rows = await db.savedPost.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: {
          topic: { select: { slug: true } },
          user: { select: { name: true, image: true, username: true } },
          _count: {
            select: {
              comments: { where: { deleted: false } },
              votes: true,
            },
          },
          votes: {
            where: { userId },
            select: { id: true },
            take: 1,
          },
          saves: {
            where: { userId },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  return rows.map((row) => row.post);
}
