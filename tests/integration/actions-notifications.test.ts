import { describe, expect, it } from 'vitest';
import {
  createComment,
  togglePostVote,
  toggleCommentVote,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/actions';
import {
  buildFormData,
  makeComment,
  makePost,
  makeTopic,
  makeUser,
} from './factories';
import { setViewer, testDb } from './setup';
import { INITIAL_ACTION_STATE } from '@/lib/types';

describe('notifications — createComment', () => {
  it('emits REPLY_TO_POST for the post author on a top-level comment', async () => {
    const author = await makeUser();
    const replier = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer({ id: replier.id, name: replier.name, email: replier.email });
    const result = await createComment(
      { postId: post.id },
      INITIAL_ACTION_STATE,
      buildFormData({ content: 'first thought on this' })
    );
    expect(result.ok).toBe(true);

    const notifs = await testDb.notification.findMany({
      where: { recipientId: author.id },
    });
    expect(notifs).toHaveLength(1);
    expect(notifs[0]).toMatchObject({
      recipientId: author.id,
      actorId: replier.id,
      kind: 'REPLY_TO_POST',
      postId: post.id,
      readAt: null,
    });
    expect(notifs[0].commentId).not.toBeNull();
  });

  it('emits REPLY_TO_COMMENT for the parent author on a nested reply', async () => {
    const postAuthor = await makeUser();
    const parentAuthor = await makeUser();
    const replier = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: postAuthor.id, topicId: topic.id });
    const parent = await makeComment({
      userId: parentAuthor.id,
      postId: post.id,
    });

    setViewer({ id: replier.id, name: replier.name, email: replier.email });
    const result = await createComment(
      { postId: post.id, parentId: parent.id },
      INITIAL_ACTION_STATE,
      buildFormData({ content: 'nested response' })
    );
    expect(result.ok).toBe(true);

    // The parent comment's author gets the notification; the post author does NOT.
    const toParent = await testDb.notification.findMany({
      where: { recipientId: parentAuthor.id },
    });
    expect(toParent).toHaveLength(1);
    expect(toParent[0].kind).toBe('REPLY_TO_COMMENT');

    const toPost = await testDb.notification.findMany({
      where: { recipientId: postAuthor.id },
    });
    expect(toPost).toHaveLength(0);
  });

  it('skips notification when replying to your own post', async () => {
    const me = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: me.id, topicId: topic.id });

    setViewer({ id: me.id, name: me.name, email: me.email });
    await createComment(
      { postId: post.id },
      INITIAL_ACTION_STATE,
      buildFormData({ content: 'self-reply on my own post' })
    );

    const count = await testDb.notification.count();
    expect(count).toBe(0);
  });

  it('skips notification when replying to your own comment', async () => {
    const me = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: me.id, topicId: topic.id });
    const myComment = await makeComment({ userId: me.id, postId: post.id });

    setViewer({ id: me.id, name: me.name, email: me.email });
    await createComment(
      { postId: post.id, parentId: myComment.id },
      INITIAL_ACTION_STATE,
      buildFormData({ content: 'continuing my own thought' })
    );

    const count = await testDb.notification.count();
    expect(count).toBe(0);
  });
});

describe('notifications — togglePostVote', () => {
  it('emits UPVOTE_POST on a fresh upvote', async () => {
    const author = await makeUser();
    const voter = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });

    setViewer({ id: voter.id, name: voter.name, email: voter.email });
    await togglePostVote(post.id);

    const notifs = await testDb.notification.findMany({
      where: { recipientId: author.id },
    });
    expect(notifs).toHaveLength(1);
    expect(notifs[0]).toMatchObject({
      recipientId: author.id,
      actorId: voter.id,
      kind: 'UPVOTE_POST',
      postId: post.id,
      commentId: null,
      readAt: null,
    });
  });

  it('does not emit a notification when unvoting', async () => {
    const author = await makeUser();
    const voter = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    await testDb.postVote.create({
      data: { userId: voter.id, postId: post.id },
    });

    setViewer({ id: voter.id, name: voter.name, email: voter.email });
    await togglePostVote(post.id);

    const notifs = await testDb.notification.count();
    expect(notifs).toBe(0);
  });

  it('skips notification on self-upvote', async () => {
    const me = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: me.id, topicId: topic.id });

    setViewer({ id: me.id, name: me.name, email: me.email });
    await togglePostVote(post.id);

    const count = await testDb.notification.count();
    expect(count).toBe(0);
  });
});

describe('notifications — toggleCommentVote', () => {
  it('emits UPVOTE_COMMENT on a fresh upvote', async () => {
    const author = await makeUser();
    const voter = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: author.id, topicId: topic.id });
    const comment = await makeComment({ userId: author.id, postId: post.id });

    setViewer({ id: voter.id, name: voter.name, email: voter.email });
    await toggleCommentVote(comment.id);

    const notifs = await testDb.notification.findMany({
      where: { recipientId: author.id },
    });
    expect(notifs).toHaveLength(1);
    expect(notifs[0]).toMatchObject({
      kind: 'UPVOTE_COMMENT',
      postId: post.id,
      commentId: comment.id,
    });
  });

  it('skips notification on self-upvote of own comment', async () => {
    const me = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: me.id, topicId: topic.id });
    const comment = await makeComment({ userId: me.id, postId: post.id });

    setViewer({ id: me.id, name: me.name, email: me.email });
    await toggleCommentVote(comment.id);

    const count = await testDb.notification.count();
    expect(count).toBe(0);
  });
});

describe('notifications — markNotificationRead (per-item)', () => {
  it('marks just the specified notification as read', async () => {
    const me = await makeUser();
    const actor = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: me.id, topicId: topic.id });

    const [a, b] = await Promise.all([
      testDb.notification.create({
        data: {
          recipientId: me.id,
          actorId: actor.id,
          kind: 'UPVOTE_POST',
          postId: post.id,
        },
      }),
      testDb.notification.create({
        data: {
          recipientId: me.id,
          actorId: actor.id,
          kind: 'REPLY_TO_POST',
          postId: post.id,
        },
      }),
    ]);

    setViewer({ id: me.id, name: me.name, email: me.email });
    await markNotificationRead(a.id);

    const a2 = await testDb.notification.findUnique({ where: { id: a.id } });
    const b2 = await testDb.notification.findUnique({ where: { id: b.id } });
    expect(a2?.readAt).not.toBeNull();
    expect(b2?.readAt).toBeNull();
  });

  it("refuses to mark another user's notification", async () => {
    const me = await makeUser();
    const otherUser = await makeUser();
    const actor = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: otherUser.id, topicId: topic.id });

    const theirs = await testDb.notification.create({
      data: {
        recipientId: otherUser.id,
        actorId: actor.id,
        kind: 'UPVOTE_POST',
        postId: post.id,
      },
    });

    setViewer({ id: me.id, name: me.name, email: me.email });
    await markNotificationRead(theirs.id);

    const after = await testDb.notification.findUnique({
      where: { id: theirs.id },
    });
    expect(after?.readAt).toBeNull();
  });

  it('is a no-op when not signed in', async () => {
    const me = await makeUser();
    const actor = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: me.id, topicId: topic.id });
    const n = await testDb.notification.create({
      data: {
        recipientId: me.id,
        actorId: actor.id,
        kind: 'UPVOTE_POST',
        postId: post.id,
      },
    });

    setViewer(null);
    await markNotificationRead(n.id);

    const after = await testDb.notification.findUnique({ where: { id: n.id } });
    expect(after?.readAt).toBeNull();
  });
});

describe('notifications — markAllNotificationsRead (bulk)', () => {
  it('marks every unread notification for the viewer as read', async () => {
    const me = await makeUser();
    const actor = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: me.id, topicId: topic.id });

    // Two unread + one already-read for me.
    await testDb.notification.createMany({
      data: [
        {
          recipientId: me.id,
          actorId: actor.id,
          kind: 'UPVOTE_POST',
          postId: post.id,
        },
        {
          recipientId: me.id,
          actorId: actor.id,
          kind: 'REPLY_TO_POST',
          postId: post.id,
        },
        {
          recipientId: me.id,
          actorId: actor.id,
          kind: 'UPVOTE_POST',
          postId: post.id,
          readAt: new Date('2025-01-01'),
        },
      ],
    });

    setViewer({ id: me.id, name: me.name, email: me.email });
    await markAllNotificationsRead();

    const unread = await testDb.notification.count({
      where: { recipientId: me.id, readAt: null },
    });
    expect(unread).toBe(0);

    // The already-read row's timestamp isn't overwritten.
    const total = await testDb.notification.count({
      where: { recipientId: me.id },
    });
    expect(total).toBe(3);
  });

  it("leaves other users' notifications alone", async () => {
    const me = await makeUser();
    const otherUser = await makeUser();
    const actor = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: me.id, topicId: topic.id });

    await testDb.notification.createMany({
      data: [
        {
          recipientId: me.id,
          actorId: actor.id,
          kind: 'UPVOTE_POST',
          postId: post.id,
        },
        {
          recipientId: otherUser.id,
          actorId: actor.id,
          kind: 'UPVOTE_POST',
          postId: post.id,
        },
      ],
    });

    setViewer({ id: me.id, name: me.name, email: me.email });
    await markAllNotificationsRead();

    const otherUnread = await testDb.notification.count({
      where: { recipientId: otherUser.id, readAt: null },
    });
    expect(otherUnread).toBe(1);
  });

  it('is a no-op when no viewer is signed in', async () => {
    const someone = await makeUser();
    const actor = await makeUser();
    const topic = await makeTopic();
    const post = await makePost({ userId: someone.id, topicId: topic.id });

    await testDb.notification.create({
      data: {
        recipientId: someone.id,
        actorId: actor.id,
        kind: 'UPVOTE_POST',
        postId: post.id,
      },
    });

    setViewer(null);
    await markAllNotificationsRead();

    const unread = await testDb.notification.count({ where: { readAt: null } });
    expect(unread).toBe(1);
  });
});
