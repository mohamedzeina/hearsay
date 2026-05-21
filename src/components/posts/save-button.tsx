'use client';

import { useState, useTransition } from 'react';
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
  const [saved, setSaved] = useState(initialSaved);
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

    const prev = saved;
    setSaved(!prev);

    startTransition(async () => {
      try {
        const result = await toggleSavedPost(postId);
        setSaved(result.saved);
        onToggle?.(result.saved);
        // If we're rendered inside the /saved page's list, an unsave should
        // drop the card from the page — that's what the user is asking for.
        if (!result.saved) savedList?.removePost(postId);
      } catch {
        setSaved(prev);
      }
    });
  };

  const s = SIZES[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? 'Unsave post' : 'Save post'}
      title={saved ? 'Saved' : 'Save'}
      className={`group inline-flex items-center justify-center rounded-full ${s.box} transition-all duration-150 motion-reduce:transition-none disabled:cursor-not-allowed ${
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
