import { db } from '@/db';
import { postInclude, type PostWithData } from '@/db/queries/posts';

// Soft cap: a power user with thousands of bookmarks shouldn't load them all
// on every render. The most-recent 100 is more than enough; older saves stay
// in the DB and would resurface if we ever add a "load older" affordance.
export const SAVED_POSTS_LIMIT = 100;

export async function fetchSavedPosts(userId: string): Promise<PostWithData[]> {
  const rows = await db.savedPost.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: SAVED_POSTS_LIMIT,
    include: {
      post: { include: postInclude(userId) },
    },
  });

  return rows.map((row) => row.post);
}
