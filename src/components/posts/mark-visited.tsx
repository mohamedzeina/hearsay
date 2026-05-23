'use client';

import { useEffect } from 'react';
import { markVisited } from '@/lib/use-visited';

interface MarkVisitedProps {
  postId: string;
}

/**
 * Render-nothing client component that marks a post as visited on mount.
 * Mount it on the post detail page; PostCardList everywhere else will
 * pick up the new state via the window event bus + storage listener.
 */
export default function MarkVisited({ postId }: MarkVisitedProps) {
  useEffect(() => {
    markVisited(postId);
  }, [postId]);
  return null;
}
