import { describe, expect, it } from 'vitest';
import { toggleTopicFollow } from '@/actions';
import { fetchFollowingPosts } from '@/db/queries/posts';
import { makePost, makeTopic, makeUser } from './factories';
import { setViewer, testDb } from './setup';

describe('toggleTopicFollow', () => {
  it('redirects when not signed in', async () => {
    const topic = await makeTopic();
    setViewer(null);
    await expect(toggleTopicFollow(topic.id)).rejects.toThrow(/NEXT_REDIRECT/);
  });

  it('creates a follow and returns followed=true', async () => {
    const viewer = await makeUser();
    const topic = await makeTopic();

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });
    const result = await toggleTopicFollow(topic.id);

    expect(result).toEqual({ followed: true });
    const count = await testDb.topicFollow.count({
      where: { userId: viewer.id, topicId: topic.id },
    });
    expect(count).toBe(1);
  });

  it('removes an existing follow and returns followed=false', async () => {
    const viewer = await makeUser();
    const topic = await makeTopic();
    await testDb.topicFollow.create({
      data: { userId: viewer.id, topicId: topic.id },
    });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });
    const result = await toggleTopicFollow(topic.id);

    expect(result).toEqual({ followed: false });
    const remaining = await testDb.topicFollow.count({
      where: { userId: viewer.id, topicId: topic.id },
    });
    expect(remaining).toBe(0);
  });

  it('is per-user: one user following does not affect another', async () => {
    const viewerA = await makeUser();
    const viewerB = await makeUser();
    const topic = await makeTopic();

    setViewer({ id: viewerA.id, name: viewerA.name, email: viewerA.email });
    await toggleTopicFollow(topic.id);

    setViewer({ id: viewerB.id, name: viewerB.name, email: viewerB.email });
    const result = await toggleTopicFollow(topic.id);

    expect(result).toEqual({ followed: true });
    expect(
      await testDb.topicFollow.count({ where: { topicId: topic.id } })
    ).toBe(2);
  });

  it('is idempotent under repeated toggles (on→off→on)', async () => {
    const viewer = await makeUser();
    const topic = await makeTopic();

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });

    expect(await toggleTopicFollow(topic.id)).toEqual({ followed: true });
    expect(await toggleTopicFollow(topic.id)).toEqual({ followed: false });
    expect(await toggleTopicFollow(topic.id)).toEqual({ followed: true });
  });
});

describe('fetchFollowingPosts', () => {
  it('returns posts from topics the viewer follows, newest first', async () => {
    const viewer = await makeUser();
    const author = await makeUser();
    const followedTopic = await makeTopic({ slug: 'followed' });
    const ignoredTopic = await makeTopic({ slug: 'ignored' });

    await testDb.topicFollow.create({
      data: { userId: viewer.id, topicId: followedTopic.id },
    });

    const oldFollowed = await makePost({
      userId: author.id,
      topicId: followedTopic.id,
      title: 'Old followed post',
    });
    const newFollowed = await makePost({
      userId: author.id,
      topicId: followedTopic.id,
      title: 'New followed post',
    });
    await makePost({
      userId: author.id,
      topicId: ignoredTopic.id,
      title: 'Ignored topic post',
    });

    // Force a deterministic createdAt ordering (factories created them
    // in the same millisecond on fast machines).
    await testDb.post.update({
      where: { id: oldFollowed.id },
      data: { createdAt: new Date('2026-01-01T00:00:00Z') },
    });
    await testDb.post.update({
      where: { id: newFollowed.id },
      data: { createdAt: new Date('2026-02-01T00:00:00Z') },
    });

    const posts = await fetchFollowingPosts(viewer.id);
    const titles = posts.map((p) => p.title);

    expect(titles).toEqual(['New followed post', 'Old followed post']);
    expect(titles).not.toContain('Ignored topic post');
  });

  it('returns an empty array when the viewer follows nothing', async () => {
    const viewer = await makeUser();
    const author = await makeUser();
    const topic = await makeTopic();
    await makePost({ userId: author.id, topicId: topic.id });

    const posts = await fetchFollowingPosts(viewer.id);
    expect(posts).toEqual([]);
  });

  it('reflects an unfollow on the next call', async () => {
    const viewer = await makeUser();
    const author = await makeUser();
    const topic = await makeTopic();
    await makePost({
      userId: author.id,
      topicId: topic.id,
      title: 'Will be unfollowed',
    });

    await testDb.topicFollow.create({
      data: { userId: viewer.id, topicId: topic.id },
    });
    expect(await fetchFollowingPosts(viewer.id)).toHaveLength(1);

    await testDb.topicFollow.deleteMany({
      where: { userId: viewer.id, topicId: topic.id },
    });
    expect(await fetchFollowingPosts(viewer.id)).toEqual([]);
  });
});
