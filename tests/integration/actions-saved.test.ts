import { describe, expect, it } from 'vitest';
import { toggleSavedPost } from '@/actions';
import { makePost, makeTopic, makeUser } from './factories';
import { setViewer, testDb } from './setup';

describe('toggleSavedPost', () => {
  it('redirects when not signed in', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer(null);
    await expect(toggleSavedPost(post.id)).rejects.toThrow(/NEXT_REDIRECT/);
  });

  it('creates a save and returns saved=true', async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });
    const result = await toggleSavedPost(post.id);

    expect(result).toEqual({ saved: true });
    const count = await testDb.savedPost.count({
      where: { userId: viewer.id, postId: post.id },
    });
    expect(count).toBe(1);
  });

  it('removes an existing save and returns saved=false', async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    await testDb.savedPost.create({
      data: { userId: viewer.id, postId: post.id },
    });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });
    const result = await toggleSavedPost(post.id);

    expect(result).toEqual({ saved: false });
    const remaining = await testDb.savedPost.count({
      where: { userId: viewer.id, postId: post.id },
    });
    expect(remaining).toBe(0);
  });

  it('is per-user: one user saving does not affect another', async () => {
    const author = await makeUser();
    const viewerA = await makeUser();
    const viewerB = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer({ id: viewerA.id, name: viewerA.name, email: viewerA.email });
    await toggleSavedPost(post.id);

    setViewer({ id: viewerB.id, name: viewerB.name, email: viewerB.email });
    const result = await toggleSavedPost(post.id);

    expect(result).toEqual({ saved: true });
    expect(await testDb.savedPost.count({ where: { postId: post.id } })).toBe(2);
  });

  it('is idempotent under repeated toggles (on→off→on)', async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });

    expect(await toggleSavedPost(post.id)).toEqual({ saved: true });
    expect(await toggleSavedPost(post.id)).toEqual({ saved: false });
    expect(await toggleSavedPost(post.id)).toEqual({ saved: true });
  });
});
