import { auth } from '@/auth';
import HomeLoadingSkeleton from './home-loading-skeleton';

// Server boundary: awaits auth() so the skeleton can match the real
// page (signed-in users see the compact greeting strip, signed-out
// users see the tall hero placeholder — otherwise the swap produces
// a noticeable ~400px height jump). The Skeleton-bearing chrome lives
// in a sibling 'use client' file because HeroUI's Skeleton uses React
// Context, which Turbopack refuses to compile from a server module.
export default async function HomeLoading() {
  const session = await auth();
  const isAuthed = !!session?.user;
  return <HomeLoadingSkeleton isAuthed={isAuthed} />;
}
