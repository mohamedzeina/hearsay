import { describe, expect, it } from 'vitest';
import { SAVED_POSTS_LIMIT, fetchSavedPosts } from '@/db/queries/saved-posts';
import { makePost, makeTopic, makeUser } from './factories';
import { testDb } from './setup';

describe('fetchSavedPosts', () => {
  it('returns an empty array when the viewer has nothing saved', async () => {
    const viewer = await makeUser();
    expect(await fetchSavedPosts(viewer.id)).toEqual([]);
  });

  it('returns saved posts newest-save-first with full PostWithData shape', async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic({ slug: 'web-dev' });
    const postOne = await makePost({
      userId: author.id,
      topicId: topic.id,
      title: 'first saved',
    });
    const postTwo = await makePost({
      userId: author.id,
      topicId: topic.id,
      title: 'second saved',
    });

    // Save postOne first, then postTwo — newest save (postTwo) should come back first.
    await testDb.savedPost.create({
      data: {
        userId: viewer.id,
        postId: postOne.id,
        createdAt: new Date(Date.now() - 60_000),
      },
    });
    await testDb.savedPost.create({
      data: { userId: viewer.id, postId: postTwo.id },
    });

    const saved = await fetchSavedPosts(viewer.id);

    expect(saved.map((p) => p.id)).toEqual([postTwo.id, postOne.id]);
    expect(saved[0].topic.slug).toBe('web-dev');
    expect(saved[0].user.name).toBe(author.name);
    expect(saved[0]._count.comments).toBe(0);
    expect(saved[0].saves).toHaveLength(1);
  });

  it('scopes results to the viewer — other users’ saves are not returned', async () => {
    const author = await makeUser();
    const viewerA = await makeUser();
    const viewerB = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    await testDb.savedPost.create({
      data: { userId: viewerB.id, postId: post.id },
    });

    expect(await fetchSavedPosts(viewerA.id)).toEqual([]);
    expect(await fetchSavedPosts(viewerB.id)).toHaveLength(1);
  });

  it(`caps the result at SAVED_POSTS_LIMIT (${SAVED_POSTS_LIMIT}) saves, newest first`, async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const totalToCreate = SAVED_POSTS_LIMIT + 5;

    // Create N posts + N saves (oldest save first → newest last).
    const postIds: string[] = [];
    for (let i = 0; i < totalToCreate; i++) {
      const post = await makePost({
        userId: author.id,
        topicId: topic.id,
        title: `post ${i}`,
      });
      postIds.push(post.id);
      await testDb.savedPost.create({
        data: {
          userId: viewer.id,
          postId: post.id,
          createdAt: new Date(Date.now() - (totalToCreate - i) * 60_000),
        },
      });
    }

    const saved = await fetchSavedPosts(viewer.id);
    expect(saved).toHaveLength(SAVED_POSTS_LIMIT);
    // Newest save first — the last postId we created should be index 0.
    expect(saved[0].id).toBe(postIds[totalToCreate - 1]);
  });
});
