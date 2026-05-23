'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { toggleTopicFollow } from '@/actions';
import { useSignInPrompt } from '@/components/auth/signin-prompt';
import { IconCheck, IconPlus } from '@/components/icons';

interface FollowButtonProps {
  topicId: string;
  topicSlug: string;
  initialFollowed: boolean;
}

// Optimistic follow/unfollow pill, modeled on SaveButton.
//
// Auth-gated via the global signin modal so signed-out users see
// "Sign in to follow this topic." instead of being redirected away.
// On click while signed-in, useOptimistic layers an in-flight state
// over the server-confirmed value; on failure the overlay
// auto-reverts so we don't have to manually rollback.
export default function FollowButton({
  topicId,
  topicSlug,
  initialFollowed,
}: FollowButtonProps) {
  const [confirmed, setConfirmed] = useState(initialFollowed);
  const [followed, addOptimistic] = useOptimistic(
    confirmed,
    (_current, next: boolean) => next
  );
  const [isPending, startTransition] = useTransition();
  const session = useSession();
  const signInPrompt = useSignInPrompt();

  const onClick = () => {
    if (session.status !== 'authenticated') {
      signInPrompt.open(`Sign in to follow #${topicSlug}.`);
      return;
    }

    const next = !confirmed;
    startTransition(async () => {
      addOptimistic(next);
      try {
        const result = await toggleTopicFollow(topicId);
        setConfirmed(result.followed);
      } catch {
        // useOptimistic snaps back to `confirmed` automatically.
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={followed}
      aria-busy={isPending}
      aria-label={
        followed ? `Unfollow #${topicSlug}` : `Follow #${topicSlug}`
      }
      className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200 motion-reduce:transition-none ${
        followed
          ? 'bg-surface text-ink-2 border border-rule hover:border-persimmon hover:text-persimmon-deep shadow-soft'
          : 'bg-ink text-cream border border-ink hover:bg-persimmon hover:border-persimmon shadow-soft'
      }`}
    >
      {followed ? (
        <>
          <IconCheck className="w-3.5 h-3.5" aria-hidden />
          Following
        </>
      ) : (
        <>
          <IconPlus className="w-3.5 h-3.5" aria-hidden />
          Follow
        </>
      )}
    </button>
  );
}
