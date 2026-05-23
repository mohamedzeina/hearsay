import { Prisma } from '@prisma/client';
import { db } from '@/db';
import { cache } from 'react';
import { getViewerId } from '@/lib/server-utils';

export function postInclude(viewerId: string | null) {
	return {
		topic: { select: { slug: true } },
		user: { select: { name: true, image: true, username: true } },
		_count: {
			select: {
				comments: { where: { deleted: false } },
				votes: true,
			},
		},
		votes: {
			where: { userId: viewerId ?? '' },
			select: { id: true },
			take: 1,
		},
		saves: {
			where: { userId: viewerId ?? '' },
			select: { id: true },
			take: 1,
		},
	} satisfies Prisma.PostInclude;
}

export type PostWithData = Prisma.PostGetPayload<{
	include: ReturnType<typeof postInclude>;
}>;

export const fetchPostById = cache(async (postId: string) => {
	const viewerId = await getViewerId();
	return db.post.findFirst({
		where: { id: postId },
		include: postInclude(viewerId),
	});
});

export async function fetchPostsBySearchTerm(term: string): Promise<PostWithData[]> {
	const viewerId = await getViewerId();
	return db.post.findMany({
		where: {
			OR: [
				{ title: { contains: term, mode: 'insensitive' } },
				{ content: { contains: term, mode: 'insensitive' } },
			],
		},
		include: postInclude(viewerId),
	});
}

export async function fetchPostByTopicSlug(slug: string): Promise<PostWithData[]> {
	const viewerId = await getViewerId();
	return db.post.findMany({
		where: { topic: { slug } },
		include: postInclude(viewerId),
	});
}

export async function fetchRecentPosts(): Promise<PostWithData[]> {
	const viewerId = await getViewerId();
	return db.post.findMany({
		orderBy: { createdAt: 'desc' },
		include: postInclude(viewerId),
	});
}

// Posts from topics the viewer follows, newest first. Returns an empty
// array if the viewer follows nothing (or isn't signed in) so callers
// can fall back to a "you don't follow anything yet" empty state
// without an auth round-trip.
export async function fetchFollowingPosts(
	userId: string
): Promise<PostWithData[]> {
	return db.post.findMany({
		where: {
			topic: {
				followers: {
					some: { userId },
				},
			},
		},
		orderBy: { createdAt: 'desc' },
		include: postInclude(userId),
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
