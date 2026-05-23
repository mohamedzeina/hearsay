import { config } from 'dotenv';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Global setup for the screenshot pipeline. Resets the test DB schema,
 * inserts an "owner" user (so the production seed in `prisma/seed.ts`
 * picks them up and adds owner-attributed posts + follows), then runs
 * the seed. Result: the dev server boots against a database that looks
 * almost identical to what a recruiter sees on the live deploy.
 */
export default async function screenshotsSetup() {
  // Load .env.test → DATABASE_URL points at the Docker test PG on 54329.
  config({ path: resolve(__dirname, '../../.env.test') });
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      '[screenshots] DATABASE_URL is empty after loading .env.test. ' +
        'Did you copy .env.test.example to .env.test?'
    );
  }

  console.log('\n[screenshots] Resetting schema on the test DB…');
  execSync('npx prisma db push --force-reset --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  console.log('[screenshots] Inserting screenshot owner user…');
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  try {
    // Pre-create the owner so the seed's "find first non-persona user"
    // step lands on us and attaches owner-flavored posts + follows.
    await db.user.create({
      data: {
        email: 'screenshots-owner@example.com',
        name: 'Mohamed Zeina',
        username: 'mohamedzeina',
        image: 'https://avatars.githubusercontent.com/u/47926485?v=4',
      },
    });
  } finally {
    await db.$disconnect();
  }

  console.log('[screenshots] Running the production seed…');
  execSync('npx tsx prisma/seed.ts', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  console.log('[screenshots] Seed complete.\n');
}
