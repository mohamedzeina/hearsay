import { testDb } from './setup';

let userCounter = 0;
let topicCounter = 0;

export async function makeUser(overrides: { name?: string; email?: string } = {}) {
  userCounter += 1;
  return testDb.user.create({
    data: {
      name: overrides.name ?? `User ${userCounter}`,
      email: overrides.email ?? `user${userCounter}@example.com`,
    },
  });
}

export async function makeTopic(
  overrides: { slug?: string; description?: string } = {}
) {
  topicCounter += 1;
  return testDb.topic.create({
    data: {
      slug: overrides.slug ?? `topic-${topicCounter}`,
      description:
        overrides.description ?? `description for topic ${topicCounter}`,
    },
  });
}

export async function makePost(args: {
  userId: string;
  topicId: string;
  title?: string;
  content?: string;
}) {
  return testDb.post.create({
    data: {
      title: args.title ?? 'A test post',
      content: args.content ?? 'Some content for the test post.',
      userId: args.userId,
      topicId: args.topicId,
    },
  });
}

export async function makeComment(args: {
  userId: string;
  postId: string;
  parentId?: string;
  content?: string;
}) {
  return testDb.comment.create({
    data: {
      content: args.content ?? 'A test comment',
      userId: args.userId,
      postId: args.postId,
      parentId: args.parentId,
    },
  });
}

export function buildFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.set(k, v);
  }
  return fd;
}
