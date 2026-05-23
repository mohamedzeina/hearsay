'use client';

import { useCallback, useOptimistic, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { toggleSavedPost } from '@/actions';
import { useSignInPrompt } from '@/components/auth/signin-prompt';
import { useSavedListContext } from '@/components/posts/saved-list-context';
import { useToast } from '@/components/common/toast';
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
  const toast = useToast();

  const doToggle = useCallback(
    (silent: boolean) => {
      const next = !confirmed;
      // Drop the card from /saved up-front so the unsave feels instant even
      // on slow Neon roundtrips. Runs OUTSIDE startTransition because React
      // marks transition-scoped updates as non-urgent and can defer them —
      // the card would visibly linger for a frame. One-way hint to the
      // list; we don't restore on server error.
      if (!next) savedList?.removePost(postId);

      if (!silent) {
        toast.show({
          eyebrow: next ? 'Saved' : 'Unsaved',
          body: next ? 'Tucked away in /saved.' : 'Removed from /saved.',
          undo: () => {
            // If this toast came from an unsave on /saved, the card has been
            // tombstoned out of the list. Restore it first (synchronous
            // setState — renders in the same frame) so Undo feels instant;
            // doToggle re-saves on the server underneath.
            if (next === false) savedList?.restorePost(postId);
            doToggle(true);
          },
        });
      }

      startTransition(async () => {
        addOptimistic(next);
        try {
          const result = await toggleSavedPost(postId);
          setConfirmed(result.saved);
          onToggle?.(result.saved);
        } catch {
          // Pull the toast back too — the action didn't land, so the
          // confirmation message is now lying.
          if (!silent) toast.dismiss();
          // No setConfirmed → useOptimistic auto-reverts when the
          // transition settles, snapping the icon back to its
          // server-confirmed state.
        }
      });
    },
    [confirmed, postId, savedList, toast, addOptimistic, onToggle]
  );

  const onClick = (e: React.MouseEvent) => {
    // PostCard wraps this in <Link> — don't navigate.
    e.preventDefault();
    e.stopPropagation();

    if (session.status !== 'authenticated') {
      signInPrompt.open('Sign in to save posts.');
      return;
    }

    doToggle(false);
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
