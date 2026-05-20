import type { Post } from '@prisma/client';
import { db } from '@/db';
import { cache } from 'react';

export type PostWithData = Post & {
	topic: { slug: string };
	user: { name: string | null; image: string | null };
	_count: { comments: number };
};

const postInclude = {
	topic: { select: { slug: true } },
	user: { select: { name: true, image: true } },
	_count: { select: { comments: { where: { deleted: false } } } },
} as const;

export const fetchPostById = cache((postId: string) =>
  db.post.findFirst({
    where: { id: postId },
    include: {
      user: { select: { name: true, image: true } },
      topic: { select: { slug: true } },
    },
  })
);

export function fetchPostsBySearchTerm(term: string): Promise<PostWithData[]> {
	return db.post.findMany({
		where: {
			OR: [
				{ title: { contains: term, mode: 'insensitive' } },
				{ content: { contains: term, mode: 'insensitive' } },
			],
		},
		include: postInclude,
	});
}

export function fetchPostByTopicSlug(slug: string): Promise<PostWithData[]> {
	return db.post.findMany({
		where: { topic: { slug } },
		include: postInclude,
	});
}

export function fetchRecentPosts(): Promise<PostWithData[]> {
	return db.post.findMany({
		orderBy: { createdAt: 'desc' },
		include: postInclude,
	});
}

export type RelatedPost = {
	id: string;
	title: string;
	createdAt: Date;
	_count: { comments: number };
};

export function fetchRelatedPosts(
	postId: string,
	topicSlug: string
): Promise<RelatedPost[]> {
	return db.post.findMany({
		where: {
			topic: { slug: topicSlug },
			NOT: { id: postId },
		},
		orderBy: { createdAt: 'desc' },
		take: 4,
		select: {
			id: true,
			title: true,
			createdAt: true,
			_count: { select: { comments: { where: { deleted: false } } } },
		},
	});
}
