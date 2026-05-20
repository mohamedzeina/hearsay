import { describe, expect, it } from 'vitest';
import { createComment, createPost, createTopic } from '@/actions';
import { buildFormData, makePost, makeTopic, makeUser } from './factories';
import { setViewer, testDb } from './setup';

describe('createTopic', () => {
  it('rejects when not signed in (after validation)', async () => {
    setViewer(null);
    const result = await createTopic(
      { errors: {} },
      buildFormData({ name: 'cooking', description: 'A topic about food.' })
    );
    expect(result.errors._form).toContain(
      'You must be signed in to create a topic'
    );
  });

  it('returns field errors when slug has uppercase', async () => {
    const user = await makeUser();
    setViewer({ id: user.id });
    const result = await createTopic(
      { errors: {} },
      buildFormData({ name: 'Cooking', description: 'A topic about food.' })
    );
    expect(result.errors.name).toBeDefined();
  });

  it('returns field errors when description is too short', async () => {
    const user = await makeUser();
    setViewer({ id: user.id });
    const result = await createTopic(
      { errors: {} },
      buildFormData({ name: 'cooking', description: 'short' })
    );
    expect(result.errors.description).toBeDefined();
  });

  it('creates the topic and redirects on success', async () => {
    const user = await makeUser();
    setViewer({ id: user.id });

    await expect(
      createTopic(
        { errors: {} },
        buildFormData({
          name: 'cooking',
          description: 'A topic about food, recipes, and tips.',
        })
      )
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const topic = await testDb.topic.findUnique({ where: { slug: 'cooking' } });
    expect(topic).not.toBeNull();
    expect(topic?.description).toBe('A topic about food, recipes, and tips.');
  });

  it('returns a form error when slug is already taken', async () => {
    const user = await makeUser();
    await makeTopic({ slug: 'cooking' });
    setViewer({ id: user.id });

    const result = await createTopic(
      { errors: {} },
      buildFormData({
        name: 'cooking',
        description: 'A duplicate slug attempt.',
      })
    );
    expect(result.errors._form).toBeDefined();
    expect(result.errors._form?.[0]).toMatch(/slug may already be taken/i);
  });
});

describe('createPost', () => {
  it('rejects when not signed in', async () => {
    const topic = await makeTopic({ slug: 'cooking' });
    setViewer(null);

    const result = await createPost(
      topic.slug,
      { errors: {} },
      buildFormData({
        title: 'A new post',
        content: 'Some content for the post.',
      })
    );
    expect(result?.errors._form).toContain(
      'You must be signed in to create a post'
    );
  });

  it('returns field errors when title is too short', async () => {
    const user = await makeUser();
    const topic = await makeTopic({ slug: 'cooking' });
    setViewer({ id: user.id });

    const result = await createPost(
      topic.slug,
      { errors: {} },
      buildFormData({ title: 'a', content: 'Some content for the post.' })
    );
    expect(result?.errors.title).toBeDefined();
  });

  it('returns form error when topic does not exist', async () => {
    const user = await makeUser();
    setViewer({ id: user.id });

    const result = await createPost(
      'nonexistent-slug',
      { errors: {} },
      buildFormData({
        title: 'A new post',
        content: 'Some content for the post.',
      })
    );
    expect(result?.errors._form).toContain('Cannot find topic');
  });

  it('creates a post and redirects on success', async () => {
    const user = await makeUser();
    const topic = await makeTopic({ slug: 'cooking' });
    setViewer({ id: user.id });

    await expect(
      createPost(
        topic.slug,
        { errors: {} },
        buildFormData({
          title: 'Pasta tips',
          content: 'Boil water then add salt.',
        })
      )
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const post = await testDb.post.findFirst({
      where: { title: 'Pasta tips' },
    });
    expect(post).not.toBeNull();
    expect(post?.userId).toBe(user.id);
    expect(post?.topicId).toBe(topic.id);
  });
});

describe('createComment', () => {
  it('rejects when not signed in', async () => {
    const author = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    setViewer(null);

    const result = await createComment(
      { postId: post.id },
      { errors: {} },
      buildFormData({ content: 'A comment body' })
    );
    expect(result.errors._form).toContain('You must sign in to do this.');
  });

  it('returns field errors when content is too short', async () => {
    const user = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: user.id, topicId: topic.id });
    setViewer({ id: user.id });

    const result = await createComment(
      { postId: post.id },
      { errors: {} },
      buildFormData({ content: 'x' })
    );
    expect(result.errors.content).toBeDefined();
  });

  it('creates a top-level comment', async () => {
    const user = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: user.id, topicId: topic.id });
    setViewer({ id: user.id });

    const result = await createComment(
      { postId: post.id },
      { errors: {} },
      buildFormData({ content: 'A thoughtful reply' })
    );

    expect(result.success).toBe(true);
    expect(result.errors).toEqual({});
    const comments = await testDb.comment.findMany({
      where: { postId: post.id },
    });
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('A thoughtful reply');
    expect(comments[0].parentId).toBeNull();
  });

  it('creates a nested reply when parentId is provided', async () => {
    const user = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: user.id, topicId: topic.id });
    const parent = await testDb.comment.create({
      data: { userId: user.id, postId: post.id, content: 'parent' },
    });
    setViewer({ id: user.id });

    const result = await createComment(
      { postId: post.id, parentId: parent.id },
      { errors: {} },
      buildFormData({ content: 'A nested reply here' })
    );

    expect(result.success).toBe(true);
    const child = await testDb.comment.findFirst({
      where: { parentId: parent.id },
    });
    expect(child).not.toBeNull();
    expect(child?.content).toBe('A nested reply here');
  });
});
