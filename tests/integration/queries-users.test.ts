import { describe, expect, it } from 'vitest';
import { fetchUserProfileByUsername } from '@/db/queries/users';
import {
  makeComment,
  makePost,
  makeTopic,
  makeUser,
} from './factories';
import { testDb } from './setup';

describe('fetchUserProfileByUsername', () => {
  it('returns null for an unknown username', async () => {
    expect(await fetchUserProfileByUsername('nobody')).toBeNull();
  });

  it('returns the user with their posts, comments, counts, and joined date', async () => {
    const joinedAt = new Date('2025-03-14T12:00:00Z');
    const user = await testDb.user.create({
      data: {
        name: 'Maya Chen',
        username: 'maya',
        email: 'maya@hearsay.dev',
        createdAt: joinedAt,
      },
    });
    const topic = await makeTopic({ slug: 'web-dev' });
    const post1 = await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'How I think about CSS',
    });
    await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'Notes on hydration',
    });
    await makeComment({
      userId: user.id,
      postId: post1.id,
      content: 'great post — agreed',
    });
    // soft-deleted comments should not surface in the profile sidebar
    const ghost = await makeComment({
      userId: user.id,
      postId: post1.id,
      content: 'whoops',
    });
    await testDb.comment.update({
      where: { id: ghost.id },
      data: { deleted: true },
    });

    const profile = await fetchUserProfileByUsername('maya');
    expect(profile).not.toBeNull();
    expect(profile!.username).toBe('maya');
    expect(profile!.name).toBe('Maya Chen');
    expect(profile!.createdAt).toEqual(joinedAt);
    expect(profile!.postCount).toBe(2);
    expect(profile!.commentCount).toBe(1);
    expect(profile!.posts).toHaveLength(2);
    expect(profile!.comments).toHaveLength(1);
    expect(profile!.comments[0].content).toBe('great post — agreed');
    expect(profile!.comments[0].post.topic.slug).toBe('web-dev');
  });

  it('orders posts and comments newest-first', async () => {
    const user = await makeUser({ username: 'lin' });
    const topic = await makeTopic();
    const older = await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'older post',
    });
    const newer = await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'newer post',
    });
    // Push the "older" row's createdAt into the past so ordering is deterministic.
    await testDb.post.update({
      where: { id: older.id },
      data: { createdAt: new Date(Date.now() - 60_000) },
    });

    const profile = await fetchUserProfileByUsername('lin');
    expect(profile!.posts.map((p) => p.id)).toEqual([newer.id, older.id]);
  });

  it('skips users without a username (treat as not yet onboarded)', async () => {
    await makeUser({ username: null, name: 'Pre-username user' });
    // No way to address them by username, so lookup returns null for any
    // candidate slug we might guess.
    expect(await fetchUserProfileByUsername('pre-username-user')).toBeNull();
  });
});
