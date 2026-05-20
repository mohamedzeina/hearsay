'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { togglePostVote, toggleCommentVote } from '@/actions';
import { useSignInPrompt } from '@/components/auth/signin-prompt';

interface VoteButtonProps {
  kind: 'post' | 'comment';
  id: string;
  initialCount: number;
  initialVoted: boolean;
  size?: 'sm' | 'md';
}

const SIZES = {
  sm: { box: 'h-7 px-2 gap-1 text-xs', icon: 'w-3.5 h-3.5' },
  md: { box: 'h-9 px-3 gap-1.5 text-sm', icon: 'w-4 h-4' },
} as const;

export default function VoteButton({
  kind,
  id,
  initialCount,
  initialVoted,
  size = 'sm',
}: VoteButtonProps) {
  const [state, setState] = useState({
    count: initialCount,
    voted: initialVoted,
  });
  const [isPending, startTransition] = useTransition();
  const session = useSession();
  const signInPrompt = useSignInPrompt();

  const onClick = (e: React.MouseEvent) => {
    // Cards are wrapped in <Link> — don't let the click navigate.
    e.preventDefault();
    e.stopPropagation();

    if (session.status !== 'authenticated') {
      signInPrompt.open('Sign in to upvote.');
      return;
    }

    const prev = state;
    const next = {
      voted: !prev.voted,
      count: prev.count + (prev.voted ? -1 : 1),
    };
    setState(next);

    startTransition(async () => {
      try {
        const result =
          kind === 'post'
            ? await togglePostVote(id)
            : await toggleCommentVote(id);
        setState({ voted: result.voted, count: result.count });
      } catch {
        setState(prev);
      }
    });
  };

  const s = SIZES[size];
  const { count, voted } = state;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={voted}
      aria-label={voted ? 'Remove upvote' : 'Upvote'}
      className={`group inline-flex items-center rounded-full ${s.box} font-semibold transition-all duration-150 motion-reduce:transition-none disabled:cursor-not-allowed ${
        voted
          ? 'bg-persimmon-soft text-persimmon-deep hover:bg-persimmon/15'
          : 'text-ink-2 hover:text-persimmon-deep hover:bg-persimmon-soft'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={voted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={voted ? 0 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${s.icon} transition-transform duration-150 motion-reduce:transition-none ${
          voted ? 'scale-110' : 'group-hover:-translate-y-0.5'
        }`}
        aria-hidden
      >
        <path d="M12 4l-8 8h5v8h6v-8h5z" />
      </svg>
      <span className="font-mono num-plate">{count}</span>
    </button>
  );
}
