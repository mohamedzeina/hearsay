import { config } from 'dotenv';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

config({ path: resolve(__dirname, '../../.env.test') });

// Prisma must be imported AFTER env vars are loaded.
const { PrismaClient } = await import('@prisma/client');
export const testDb = new PrismaClient();

// Stub Next.js server-only modules that throw outside the Next runtime.
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// React's cache() is server-component-only; pass through in tests.
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, cache: <F,>(fn: F) => fn };
});

vi.mock('next/navigation', () => {
  class RedirectError extends Error {
    digest: string;
    constructor(url: string) {
      super(`NEXT_REDIRECT: ${url}`);
      this.digest = `NEXT_REDIRECT;${url}`;
    }
  }
  return {
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url);
    }),
    notFound: vi.fn(() => {
      throw new Error('NEXT_NOT_FOUND');
    }),
  };
});

// Mock the db singleton — actions/queries import @/db; redirect that to testDb.
vi.mock('@/db', () => ({ db: testDb }));

// Mock auth — each test sets the current viewer via setViewer() (see helpers.ts).
let __viewer: { id: string; name?: string | null; email?: string | null } | null = null;
export function setViewer(user: typeof __viewer) {
  __viewer = user;
}
vi.mock('@/lib/server-utils', () => ({
  requireAuth: async () => __viewer,
  getViewerId: async () => __viewer?.id ?? null,
}));
vi.mock('@/auth', () => ({
  auth: async () => (__viewer ? { user: __viewer } : null),
}));

beforeAll(async () => {
  // Push schema to the test DB. `prisma db push --force-reset` drops & recreates.
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'pipe',
  });
});

afterEach(async () => {
  // Truncate every table between tests — fast on small data, cascades FKs.
  await testDb.$executeRawUnsafe(
    'TRUNCATE TABLE "PostVote", "CommentVote", "SavedPost", "Comment", "Post", "Topic", "Session", "Account", "VerificationToken", "User" RESTART IDENTITY CASCADE'
  );
  setViewer(null);
});

afterAll(async () => {
  await testDb.$disconnect();
});
