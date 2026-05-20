import { describe, expect, it } from 'vitest';
import {
  fetchPostById,
  fetchPostByTopicSlug,
  fetchPostsBySearchTerm,
  fetchRecentPosts,
  fetchRelatedPosts,
} from '@/db/queries/posts';
import { makePost, makeTopic, makeUser } from './factories';
import { setViewer } from './setup';

describe('fetchPostById', () => {
  it('returns the post with topic, user, and counts', async () => {
    const user = await makeUser({ name: 'Alice' });
    const topic = await makeTopic({ slug: 'cooking' });
    const post = await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'Pasta tips',
    });

    const result = await fetchPostById(post.id);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(post.id);
    expect(result?.title).toBe('Pasta tips');
    expect(result?.topic.slug).toBe('cooking');
    expect(result?.user.name).toBe('Alice');
    expect(result?._count.comments).toBe(0);
    expect(result?._count.votes).toBe(0);
    expect(result?.votes).toEqual([]);
  });

  it('returns null when the post does not exist', async () => {
    expect(await fetchPostById('nonexistent')).toBeNull();
  });

  it('does not count soft-deleted comments', async () => {
    const user = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: user.id, topicId: topic.id });
    await testDbHelpers.makeComment({
      userId: user.id,
      postId: post.id,
      content: 'visible',
    });
    await testDbHelpers.makeComment({
      userId: user.id,
      postId: post.id,
      content: 'hidden',
      deleted: true,
    });

    const result = await fetchPostById(post.id);
    expect(result?._count.comments).toBe(1);
  });

  it('returns viewer-voted state when viewer has voted', async () => {
    const author = await makeUser();
    const viewer = await makeUser({ name: 'Viewer' });
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    await testDbHelpers.makePostVote(viewer.id, post.id);

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });
    const result = await fetchPostById(post.id);
    expect(result?.votes).toHaveLength(1);
    expect(result?._count.votes).toBe(1);
  });
});

describe('fetchPostsBySearchTerm', () => {
  it('matches title case-insensitively', async () => {
    const user = await makeUser();
    const topic = await makeTopic();
    await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'JavaScript is fun',
    });
    await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'Rust is fast',
    });

    const results = await fetchPostsBySearchTerm('javascript');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('JavaScript is fun');
  });

  it('matches content', async () => {
    const user = await makeUser();
    const topic = await makeTopic();
    await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'A post',
      content: 'I love hummingbirds',
    });

    const results = await fetchPostsBySearchTerm('hummingbird');
    expect(results).toHaveLength(1);
  });

  it('returns empty array when no matches', async () => {
    expect(await fetchPostsBySearchTerm('nothing-here')).toEqual([]);
  });
});

describe('fetchPostByTopicSlug', () => {
  it('returns only posts in the given topic', async () => {
    const user = await makeUser();
    const cooking = await makeTopic({ slug: 'cooking' });
    const music = await makeTopic({ slug: 'music' });

    await makePost({ userId: user.id, topicId: cooking.id, title: 'Pasta' });
    await makePost({ userId: user.id, topicId: cooking.id, title: 'Bread' });
    await makePost({ userId: user.id, topicId: music.id, title: 'Jazz' });

    const results = await fetchPostByTopicSlug('cooking');
    expect(results).toHaveLength(2);
    expect(results.map((p) => p.title).sort()).toEqual(['Bread', 'Pasta']);
  });

  it('returns empty array for unknown slug', async () => {
    expect(await fetchPostByTopicSlug('does-not-exist')).toEqual([]);
  });
});

describe('fetchRecentPosts', () => {
  it('orders posts by createdAt desc', async () => {
    const user = await makeUser();
    const topic = await makeTopic();

    const older = await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'Older',
    });
    // Force ordering: bump createdAt of the second post forward.
    const newer = await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'Newer',
    });
    await testDbHelpers.setPostCreatedAt(older.id, new Date('2020-01-01'));
    await testDbHelpers.setPostCreatedAt(newer.id, new Date('2025-01-01'));

    const results = await fetchRecentPosts();
    expect(results.map((p) => p.title)).toEqual(['Newer', 'Older']);
  });

  it('returns empty array when no posts', async () => {
    expect(await fetchRecentPosts()).toEqual([]);
  });
});

describe('fetchRelatedPosts', () => {
  it('excludes the given post and limits to 4', async () => {
    const user = await makeUser();
    const topic = await makeTopic({ slug: 'cooking' });

    const target = await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'Target',
    });
    for (let i = 0; i < 5; i++) {
      await makePost({
        userId: user.id,
        topicId: topic.id,
        title: `Other ${i}`,
      });
    }

    const results = await fetchRelatedPosts(target.id, 'cooking');
    expect(results).toHaveLength(4);
    expect(results.find((r) => r.id === target.id)).toBeUndefined();
  });

  it('only returns posts in the same topic', async () => {
    const user = await makeUser();
    const cooking = await makeTopic({ slug: 'cooking' });
    const music = await makeTopic({ slug: 'music' });

    const target = await makePost({
      userId: user.id,
      topicId: cooking.id,
      title: 'Target',
    });
    await makePost({ userId: user.id, topicId: cooking.id, title: 'Sibling' });
    await makePost({
      userId: user.id,
      topicId: music.id,
      title: 'Different topic',
    });

    const results = await fetchRelatedPosts(target.id, 'cooking');
    expect(results.map((r) => r.title)).toEqual(['Sibling']);
  });
});

// Helpers that need testDb but aren't worth promoting to factories.ts.
import { testDb } from './setup';
const testDbHelpers = {
  makeComment: async (args: {
    userId: string;
    postId: string;
    content: string;
    deleted?: boolean;
  }) =>
    testDb.comment.create({
      data: {
        userId: args.userId,
        postId: args.postId,
        content: args.content,
        deleted: args.deleted ?? false,
      },
    }),
  makePostVote: async (userId: string, postId: string) =>
    testDb.postVote.create({ data: { userId, postId } }),
  setPostCreatedAt: async (postId: string, when: Date) =>
    testDb.post.update({ where: { id: postId }, data: { createdAt: when } }),
};
