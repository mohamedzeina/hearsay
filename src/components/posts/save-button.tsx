'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { toggleSavedPost } from '@/actions';
import { useSignInPrompt } from '@/components/auth/signin-prompt';
import { useSavedListContext } from '@/components/posts/saved-list-context';
import { IconBookmark } from '@/components/icons';

interface SaveButtonProps {
  postId: string;
  initialSaved: boolean;
  size?: 'sm' | 'md';
  /** Fires after a successful server toggle, with the new saved state. */
  onToggle?: (saved: boolean) => void;
}

const SIZES = {
  sm: { box: 'h-7 w-7', icon: 'w-3.5 h-3.5' },
  md: { box: 'h-9 w-9', icon: 'w-4 h-4' },
} as const;

export default function SaveButton({
  postId,
  initialSaved,
  size = 'sm',
  onToggle,
}: SaveButtonProps) {
  // The base state is what the server confirmed. useOptimistic layers an
  // in-flight overlay on top during a transition and auto-reverts on failure
  // — no manual rollback bookkeeping the way the useState version needed.
  const [confirmed, setConfirmed] = useState(initialSaved);
  const [saved, addOptimistic] = useOptimistic(
    confirmed,
    (_current, next: boolean) => next
  );
  const [isPending, startTransition] = useTransition();
  const session = useSession();
  const signInPrompt = useSignInPrompt();
  const savedList = useSavedListContext();

  const onClick = (e: React.MouseEvent) => {
    // PostCard wraps this in <Link> — don't navigate.
    e.preventDefault();
    e.stopPropagation();

    if (session.status !== 'authenticated') {
      signInPrompt.open('Sign in to save posts.');
      return;
    }

    startTransition(async () => {
      const next = !confirmed;
      addOptimistic(next);
      // Drop the card from /saved up-front so the unsave feels instant even on
      // slow Neon roundtrips. One-way hint to the list; we don't restore.
      if (!next) savedList?.removePost(postId);

      try {
        const result = await toggleSavedPost(postId);
        setConfirmed(result.saved);
        onToggle?.(result.saved);
      } catch {
        // No setConfirmed → useOptimistic auto-reverts when the transition
        // settles, snapping the icon back to its server-confirmed state.
      }
    });
  };

  const s = SIZES[size];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-busy={isPending}
      aria-label={saved ? 'Unsave post' : 'Save post'}
      title={saved ? 'Saved' : 'Save'}
      className={`group inline-flex items-center justify-center rounded-full ${s.box} transition-all duration-150 motion-reduce:transition-none ${
        saved
          ? 'text-persimmon-deep hover:bg-persimmon-soft'
          : 'text-ink-3 hover:text-persimmon-deep hover:bg-persimmon-soft'
      }`}
    >
      <IconBookmark
        filled={saved}
        className={`${s.icon} transition-transform duration-150 motion-reduce:transition-none ${
          saved ? 'scale-110' : 'group-hover:-translate-y-0.5'
        }`}
        aria-hidden
      />
    </button>
  );
}
