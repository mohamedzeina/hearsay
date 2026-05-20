import { config } from 'dotenv';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

export default async function globalSetup() {
  config({ path: resolve(__dirname, '../../.env.test') });

  // Reset schema then seed minimal browse data — topics, posts, comments.
  execSync('npx prisma db push --force-reset --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env },
  });

  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();

  try {
    const seed = await db.user.create({
      data: { name: 'Seed Author', email: 'seed@example.com' },
    });

    const cooking = await db.topic.create({
      data: {
        slug: 'cooking',
        description: 'All about food, recipes, and kitchen experiments.',
      },
    });
    const music = await db.topic.create({
      data: {
        slug: 'music',
        description: 'Songs, albums, instruments — discuss it all.',
      },
    });

    await db.post.create({
      data: {
        title: 'My favorite pasta sauce',
        content:
          'Slow-cooked tomato with garlic, olive oil, and a touch of basil.',
        topicId: cooking.id,
        userId: seed.id,
      },
    });
    await db.post.create({
      data: {
        title: 'What is everyone listening to?',
        content: 'I have been on a jazz kick lately. Recommendations welcome.',
        topicId: music.id,
        userId: seed.id,
      },
    });
  } finally {
    await db.$disconnect();
  }
}
