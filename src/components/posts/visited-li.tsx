'use client';

import { useVisited } from '@/lib/use-visited';

interface VisitedLiProps {
  postId: string;
  /** Extra classes merged onto the <li> (e.g. `rise` for the staggered entry). */
  className?: string;
  children: React.ReactNode;
}

/**
 * <li> wrapper that fades when the post id is in the local visited set.
 * Use it anywhere a PostCard is rendered in a list — the fade follows
 * the user across the app (home, /saved, topic pages, profile, search)
 * without each caller having to wire `useVisited` itself.
 */
export default function VisitedLi({
  postId,
  className = '',
  children,
}: VisitedLiProps) {
  const visited = useVisited();
  const isVisited = visited.has(postId);
  return (
    <li
      data-visited={isVisited || undefined}
      className={`${className} transition-opacity duration-300 motion-reduce:transition-none ${
        isVisited ? 'opacity-60 hover:opacity-100' : 'opacity-100'
      }`.trim()}
    >
      {children}
    </li>
  );
}
