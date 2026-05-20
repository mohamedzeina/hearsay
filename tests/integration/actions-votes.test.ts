import { describe, expect, it } from 'vitest';
import { togglePostVote, toggleCommentVote } from '@/actions';
import {
  makeComment,
  makePost,
  makeTopic,
  makeUser,
} from './factories';
import { setViewer, testDb } from './setup';

describe('togglePostVote', () => {
  it('redirects when not signed in', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer(null);
    await expect(togglePostVote(post.id)).rejects.toThrow(/NEXT_REDIRECT/);
  });

  it('creates a vote and returns voted=true with count=1', async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });
    const result = await togglePostVote(post.id);

    expect(result).toEqual({ voted: true, count: 1 });
    const count = await testDb.postVote.count({ where: { postId: post.id } });
    expect(count).toBe(1);
  });

  it('removes an existing vote and returns voted=false with count=0', async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    await testDb.postVote.create({
      data: { userId: viewer.id, postId: post.id },
    });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });
    const result = await togglePostVote(post.id);

    expect(result).toEqual({ voted: false, count: 0 });
    const remaining = await testDb.postVote.count({
      where: { postId: post.id },
    });
    expect(remaining).toBe(0);
  });

  it('reflects votes from other users in the count', async () => {
    const author = await makeUser();
    const otherUser = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    await testDb.postVote.create({
      data: { userId: otherUser.id, postId: post.id },
    });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });
    const result = await togglePostVote(post.id);

    expect(result).toEqual({ voted: true, count: 2 });
  });

  it('is idempotent under repeated toggles (on→off→on)', async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });

    const first = await togglePostVote(post.id);
    expect(first).toEqual({ voted: true, count: 1 });

    const second = await togglePostVote(post.id);
    expect(second).toEqual({ voted: false, count: 0 });

    const third = await togglePostVote(post.id);
    expect(third).toEqual({ voted: true, count: 1 });
  });
});

describe('toggleCommentVote', () => {
  it('redirects when not signed in', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({
      userId: author.id,
      postId: post.id,
    });

    setViewer(null);
    await expect(toggleCommentVote(comment.id)).rejects.toThrow(
      /NEXT_REDIRECT/
    );
  });

  it('toggles a comment vote on and off', async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({
      userId: author.id,
      postId: post.id,
    });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });

    const on = await toggleCommentVote(comment.id);
    expect(on).toEqual({ voted: true, count: 1 });

    const off = await toggleCommentVote(comment.id);
    expect(off).toEqual({ voted: false, count: 0 });
  });
});
