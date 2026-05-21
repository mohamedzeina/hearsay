import { describe, expect, it } from 'vitest';
import { editComment, editPost } from '@/actions';
import {
  buildFormData,
  makeComment,
  makePost,
  makeTopic,
  makeUser,
} from './factories';
import { setViewer, testDb } from './setup';

describe('editPost', () => {
  it('rejects when not signed in', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    setViewer(null);

    const result = await editPost(
      post.id,
      { errors: {} },
      buildFormData({ title: 'Updated title', content: 'Updated content body.' })
    );

    expect(result.errors._form).toContain(
      'You must be signed in to edit a post.'
    );
  });

  it('returns field errors when title is too short', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    setViewer({ id: author.id });

    const result = await editPost(
      post.id,
      { errors: {} },
      buildFormData({ title: 'no', content: 'Updated content body.' })
    );

    expect(result.errors.title).toBeDefined();
  });

  it('returns field errors when content is too short', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    setViewer({ id: author.id });

    const result = await editPost(
      post.id,
      { errors: {} },
      buildFormData({ title: 'A reasonable title', content: 'too short' })
    );

    expect(result.errors.content).toBeDefined();
  });

  it('rejects when the post does not exist', async () => {
    const user = await makeUser();
    setViewer({ id: user.id });

    const result = await editPost(
      'nonexistent',
      { errors: {} },
      buildFormData({ title: 'A title that fits', content: 'Body content here.' })
    );

    expect(result.errors._form).toContain('Post not found.');
  });

  it('rejects when caller is not the post author', async () => {
    const author = await makeUser();
    const other = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    setViewer({ id: other.id });

    const result = await editPost(
      post.id,
      { errors: {} },
      buildFormData({ title: 'A title that fits', content: 'Body content here.' })
    );

    expect(result.errors._form).toContain('You can only edit your own posts.');

    const unchanged = await testDb.post.findUnique({ where: { id: post.id } });
    expect(unchanged?.title).toBe(post.title);
    expect(unchanged?.editedAt).toBeNull();
  });

  it('updates the post and stamps editedAt when caller is the author', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({
      userId: author.id,
      topicId: topic.id,
      title: 'Original title',
      content: 'Original content body.',
    });
    setViewer({ id: author.id });

    const before = Date.now();
    const result = await editPost(
      post.id,
      { errors: {} },
      buildFormData({
        title: 'A cleaner title',
        content: 'Cleaner content body, fixing typos.',
      })
    );
    const after = Date.now();

    expect(result.success).toBe(true);

    const fresh = await testDb.post.findUnique({ where: { id: post.id } });
    expect(fresh?.title).toBe('A cleaner title');
    expect(fresh?.content).toBe('Cleaner content body, fixing typos.');
    expect(fresh?.editedAt).not.toBeNull();
    const stamp = fresh!.editedAt!.getTime();
    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(after);
  });
});

describe('editComment', () => {
  it('rejects when not signed in', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({ userId: author.id, postId: post.id });
    setViewer(null);

    const result = await editComment(
      comment.id,
      { errors: {} },
      buildFormData({ content: 'Updated content.' })
    );

    expect(result.errors._form).toContain(
      'You must be signed in to edit a comment.'
    );
  });

  it('returns field errors when content is too short', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({ userId: author.id, postId: post.id });
    setViewer({ id: author.id });

    const result = await editComment(
      comment.id,
      { errors: {} },
      buildFormData({ content: 'no' })
    );

    expect(result.errors.content).toBeDefined();
  });

  it('rejects when caller is not the comment author', async () => {
    const author = await makeUser();
    const other = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({ userId: author.id, postId: post.id });
    setViewer({ id: other.id });

    const result = await editComment(
      comment.id,
      { errors: {} },
      buildFormData({ content: 'Trying to edit someone else.' })
    );

    expect(result.errors._form).toContain(
      'You can only edit your own comments.'
    );

    const unchanged = await testDb.comment.findUnique({
      where: { id: comment.id },
    });
    expect(unchanged?.content).toBe(comment.content);
    expect(unchanged?.editedAt).toBeNull();
  });

  it('rejects when the comment has been soft-deleted', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({ userId: author.id, postId: post.id });
    await testDb.comment.update({
      where: { id: comment.id },
      data: { deleted: true },
    });
    setViewer({ id: author.id });

    const result = await editComment(
      comment.id,
      { errors: {} },
      buildFormData({ content: 'Trying to resurrect.' })
    );

    expect(result.errors._form).toContain('This comment has been deleted.');
  });

  it('updates the comment and stamps editedAt when caller is the author', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({
      userId: author.id,
      postId: post.id,
      content: 'Original comment text.',
    });
    setViewer({ id: author.id });

    const before = Date.now();
    const result = await editComment(
      comment.id,
      { errors: {} },
      buildFormData({ content: 'Tidier comment text.' })
    );
    const after = Date.now();

    expect(result.success).toBe(true);

    const fresh = await testDb.comment.findUnique({
      where: { id: comment.id },
    });
    expect(fresh?.content).toBe('Tidier comment text.');
    expect(fresh?.editedAt).not.toBeNull();
    const stamp = fresh!.editedAt!.getTime();
    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(after);
  });
});
