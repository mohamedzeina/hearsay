import { auth } from '@/auth';

export async function requireAuth() {
  const session = await auth();
  return session?.user ?? null;
}

export async function getViewerId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
