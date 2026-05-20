import { describe, expect, it } from 'vitest';
import { deletePost, deleteComment } from '@/actions';
import { makeComment, makePost, makeTopic, makeUser } from './factories';
import { setViewer, testDb } from './setup';

describe('deletePost', () => {
  it('rejects when not signed in', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    setViewer(null);

    const result = await deletePost(post.id);
    expect(result).toEqual({
      error: 'You must be signed in to delete a post.',
    });
  });

  it('rejects when post not found', async () => {
    const user = await makeUser();
    setViewer({ id: user.id });

    const result = await deletePost('nonexistent');
    expect(result).toEqual({ error: 'Post not found.' });
  });

  it('rejects when caller is not the post author', async () => {
    const author = await makeUser();
    const other = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer({ id: other.id });
    const result = await deletePost(post.id);
    expect(result).toEqual({
      error: 'You can only delete your own posts.',
    });

    // Post still exists.
    const stillThere = await testDb.post.findUnique({ where: { id: post.id } });
    expect(stillThere).not.toBeNull();
  });

  it('deletes the post and redirects when caller is the author', async () => {
    const author = await makeUser();
    const topic = await makeTopic({ slug: 'cooking' });
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer({ id: author.id });
    await expect(deletePost(post.id)).rejects.toThrow(/NEXT_REDIRECT/);

    const stillThere = await testDb.post.findUnique({ where: { id: post.id } });
    expect(stillThere).toBeNull();
  });
});

describe('deleteComment', () => {
  it('rejects when not signed in', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({ userId: author.id, postId: post.id });

    setViewer(null);
    const result = await deleteComment(comment.id);
    expect(result.error).toMatch(/signed in/);
  });

  it('rejects when comment not found', async () => {
    const user = await makeUser();
    setViewer({ id: user.id });
    expect(await deleteComment('nonexistent')).toEqual({
      error: 'Comment not found.',
    });
  });

  it('rejects when caller is not the comment author', async () => {
    const author = await makeUser();
    const other = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({ userId: author.id, postId: post.id });

    setViewer({ id: other.id });
    const result = await deleteComment(comment.id);
    expect(result.error).toMatch(/own comments/);

    const stillThere = await testDb.comment.findUnique({
      where: { id: comment.id },
    });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.deleted).toBe(false);
  });

  it('hard-deletes a leaf comment (no children)', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({ userId: author.id, postId: post.id });

    setViewer({ id: author.id });
    const result = await deleteComment(comment.id);
    expect(result).toEqual({});

    const stillThere = await testDb.comment.findUnique({
      where: { id: comment.id },
    });
    expect(stillThere).toBeNull();
  });

  it('soft-deletes a comment that has children', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const parent = await makeComment({ userId: author.id, postId: post.id });
    await makeComment({
      userId: author.id,
      postId: post.id,
      parentId: parent.id,
    });

    setViewer({ id: author.id });
    const result = await deleteComment(parent.id);
    expect(result).toEqual({});

    const stillThere = await testDb.comment.findUnique({
      where: { id: parent.id },
    });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.deleted).toBe(true);
  });
});
