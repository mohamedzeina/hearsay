import { describe, expect, it } from 'vitest';
import { createComment, createPost } from '@/actions';
import {
  buildFormData,
  makeComment,
  makePost,
  makeTopic,
  makeUser,
} from './factories';
import { setViewer, testDb } from './setup';
import { INITIAL_ACTION_STATE } from '@/lib/types';

describe('mentions — createPost', () => {
  it('emits MENTION notifications to each mentioned user', async () => {
    const author = await makeUser({ username: 'author' });
    const maya = await makeUser({ username: 'maya' });
    const theo = await makeUser({ username: 'theo' });
    const topic = await makeTopic({ slug: 'thoughts' });

    setViewer({ id: author.id, name: author.name, email: author.email });
    const result = await createPost(
      topic.slug,
      INITIAL_ACTION_STATE,
      buildFormData({
        title: 'A post that pings two people',
        content: 'Curious what @maya and @theo think about this.',
      })
    );
    expect(result.ok).toBe(true);

    const notifs = await testDb.notification.findMany({
      where: { actorId: author.id },
      orderBy: { recipientId: 'asc' },
    });
    expect(notifs).toHaveLength(2);
    expect(notifs.every((n) => n.kind === 'MENTION')).toBe(true);
    const recipients = notifs.map((n) => n.recipientId).sort();
    expect(recipients).toEqual([maya.id, theo.id].sort());
    // Post-only mentions never set commentId.
    expect(notifs.every((n) => n.commentId === null)).toBe(true);
  });

  it('skips a self-mention', async () => {
    const author = await makeUser({ username: 'narcissus' });
    const topic = await makeTopic();

    setViewer({ id: author.id, name: author.name, email: author.email });
    await createPost(
      topic.slug,
      INITIAL_ACTION_STATE,
      buildFormData({
        title: 'Talking about myself',
        content: 'I think @narcissus has some good points actually.',
      })
    );

    const count = await testDb.notification.count();
    expect(count).toBe(0);
  });

  it('skips mentions of usernames that do not exist', async () => {
    const author = await makeUser({ username: 'author' });
    const topic = await makeTopic();

    setViewer({ id: author.id, name: author.name, email: author.email });
    await createPost(
      topic.slug,
      INITIAL_ACTION_STATE,
      buildFormData({
        title: 'Mentioning a ghost',
        content: 'Hey @nonexistent-user what do you think.',
      })
    );

    const count = await testDb.notification.count();
    expect(count).toBe(0);
  });

  it('dedupes when a user is mentioned twice', async () => {
    const author = await makeUser({ username: 'author' });
    const maya = await makeUser({ username: 'maya' });
    const topic = await makeTopic();

    setViewer({ id: author.id, name: author.name, email: author.email });
    await createPost(
      topic.slug,
      INITIAL_ACTION_STATE,
      buildFormData({
        title: 'Doubled-up ping',
        content: 'Bringing in @maya again. @maya please weigh in.',
      })
    );

    const notifs = await testDb.notification.findMany({
      where: { recipientId: maya.id },
    });
    expect(notifs).toHaveLength(1);
  });

  it('does not emit a mention found only inside a code block', async () => {
    const author = await makeUser({ username: 'author' });
    const maya = await makeUser({ username: 'maya' });
    const topic = await makeTopic();

    setViewer({ id: author.id, name: author.name, email: author.email });
    await createPost(
      topic.slug,
      INITIAL_ACTION_STATE,
      buildFormData({
        title: 'Code only',
        content: 'Look at this snippet:\n\n```\necho @maya\n```\n\nThat is all.',
      })
    );

    const notifs = await testDb.notification.count({
      where: { recipientId: maya.id },
    });
    expect(notifs).toBe(0);
  });
});

describe('mentions — createComment', () => {
  it('emits a MENTION to the mentioned user alongside the reply notification', async () => {
    const postAuthor = await makeUser({ username: 'postauth' });
    const replier = await makeUser({ username: 'replier' });
    const lin = await makeUser({ username: 'lin' });
    const topic = await makeTopic();
    const post = await makePost({ userId: postAuthor.id, topicId: topic.id });

    setViewer({ id: replier.id, name: replier.name, email: replier.email });
    await createComment(
      { postId: post.id },
      INITIAL_ACTION_STATE,
      buildFormData({ content: 'Adding @lin to this conversation.' })
    );

    const linNotifs = await testDb.notification.findMany({
      where: { recipientId: lin.id },
    });
    expect(linNotifs).toHaveLength(1);
    expect(linNotifs[0].kind).toBe('MENTION');
    // Comment-context mentions carry commentId so the bell deep-links.
    expect(linNotifs[0].commentId).not.toBeNull();
    expect(linNotifs[0].postId).toBe(post.id);

    // The post author still gets their reply notification.
    const authorNotifs = await testDb.notification.findMany({
      where: { recipientId: postAuthor.id },
    });
    expect(authorNotifs).toHaveLength(1);
    expect(authorNotifs[0].kind).toBe('REPLY_TO_POST');
  });

  it('does not double-notify when the reply recipient is also the mentioned user', async () => {
    const postAuthor = await makeUser({ username: 'postauth' });
    const replier = await makeUser({ username: 'replier' });
    const topic = await makeTopic();
    const post = await makePost({ userId: postAuthor.id, topicId: topic.id });

    setViewer({ id: replier.id, name: replier.name, email: replier.email });
    await createComment(
      { postId: post.id },
      INITIAL_ACTION_STATE,
      buildFormData({ content: 'Hey @postauth, great post — quick follow-up.' })
    );

    // Only the REPLY_TO_POST notification — the MENTION is suppressed because
    // postAuthor already got pinged for the reply itself.
    const notifs = await testDb.notification.findMany({
      where: { recipientId: postAuthor.id },
    });
    expect(notifs).toHaveLength(1);
    expect(notifs[0].kind).toBe('REPLY_TO_POST');
  });

  it('skips a self-mention in a comment', async () => {
    const me = await makeUser({ username: 'me' });
    const topic = await makeTopic();
    const post = await makePost({ userId: me.id, topicId: topic.id });

    setViewer({ id: me.id, name: me.name, email: me.email });
    await createComment(
      { postId: post.id },
      INITIAL_ACTION_STATE,
      buildFormData({ content: 'For the record, @me always thinks this.' })
    );

    const count = await testDb.notification.count();
    expect(count).toBe(0);
  });

  it('combines a mention notification with a reply-to-comment notification (different recipients)', async () => {
    const parentAuthor = await makeUser({ username: 'parentauth' });
    const replier = await makeUser({ username: 'replier' });
    const lin = await makeUser({ username: 'lin' });
    const topic = await makeTopic();
    const post = await makePost({ userId: parentAuthor.id, topicId: topic.id });
    const parent = await makeComment({
      userId: parentAuthor.id,
      postId: post.id,
    });

    setViewer({ id: replier.id, name: replier.name, email: replier.email });
    await createComment(
      { postId: post.id, parentId: parent.id },
      INITIAL_ACTION_STATE,
      buildFormData({ content: 'cc @lin for visibility' })
    );

    const parentNotifs = await testDb.notification.findMany({
      where: { recipientId: parentAuthor.id },
    });
    expect(parentNotifs).toHaveLength(1);
    expect(parentNotifs[0].kind).toBe('REPLY_TO_COMMENT');

    const linNotifs = await testDb.notification.findMany({
      where: { recipientId: lin.id },
    });
    expect(linNotifs).toHaveLength(1);
    expect(linNotifs[0].kind).toBe('MENTION');
  });
});
