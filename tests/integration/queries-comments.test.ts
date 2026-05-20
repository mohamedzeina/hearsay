import { describe, expect, it } from 'vitest';
import { fetchCommentsByPostId } from '@/db/queries/comments';
import { makeComment, makePost, makeTopic, makeUser } from './factories';
import { setViewer, testDb } from './setup';

describe('fetchCommentsByPostId', () => {
  it('returns all comments on the post (including soft-deleted)', async () => {
    const user = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: user.id, topicId: topic.id });

    await makeComment({ userId: user.id, postId: post.id, content: 'first' });
    const c2 = await makeComment({
      userId: user.id,
      postId: post.id,
      content: 'second',
    });
    await testDb.comment.update({
      where: { id: c2.id },
      data: { deleted: true },
    });

    const results = await fetchCommentsByPostId(post.id);
    // Soft-deleted comments are still returned so threads stay intact;
    // they should be rendered as placeholders by the UI.
    expect(results).toHaveLength(2);
  });

  it('returns empty array when no comments', async () => {
    const user = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: user.id, topicId: topic.id });

    expect(await fetchCommentsByPostId(post.id)).toEqual([]);
  });

  it('includes the viewer-voted state per comment', async () => {
    const author = await makeUser();
    const viewer = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const c1 = await makeComment({ userId: author.id, postId: post.id });
    const c2 = await makeComment({ userId: author.id, postId: post.id });
    await testDb.commentVote.create({
      data: { userId: viewer.id, commentId: c1.id },
    });

    setViewer({ id: viewer.id, name: viewer.name, email: viewer.email });

    const results = await fetchCommentsByPostId(post.id);
    const c1Result = results.find((r) => r.id === c1.id)!;
    const c2Result = results.find((r) => r.id === c2.id)!;
    expect(c1Result.votes).toHaveLength(1);
    expect(c1Result._count.votes).toBe(1);
    expect(c2Result.votes).toEqual([]);
    expect(c2Result._count.votes).toBe(0);
  });
});
