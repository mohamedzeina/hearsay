import { cache } from 'react';
import { db } from '@/db';
import { getViewerId } from '@/lib/server-utils';
import { postInclude, type PostWithData } from '@/db/queries/posts';

export type UserProfileComment = {
  id: string;
  postId: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
  deleted: boolean;
  _count: { votes: number };
  post: {
    id: string;
    title: string;
    topic: { slug: string };
  };
};

export type UserProfile = {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  createdAt: Date;
  posts: PostWithData[];
  comments: UserProfileComment[];
  postCount: number;
  commentCount: number;
};

export const fetchUserProfileByUsername = cache(
  async (username: string): Promise<UserProfile | null> => {
    const viewerId = await getViewerId();
    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user || !user.username) return null;

    const [posts, comments, postCount, commentCount] = await Promise.all([
      db.post.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: postInclude(viewerId),
      }),
      db.comment.findMany({
        where: { userId: user.id, deleted: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          postId: true,
          content: true,
          createdAt: true,
          editedAt: true,
          deleted: true,
          _count: { select: { votes: true } },
          post: {
            select: {
              id: true,
              title: true,
              topic: { select: { slug: true } },
            },
          },
        },
      }),
      db.post.count({ where: { userId: user.id } }),
      db.comment.count({ where: { userId: user.id, deleted: false } }),
    ]);

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      createdAt: user.createdAt,
      posts,
      comments,
      postCount,
      commentCount,
    };
  }
);
