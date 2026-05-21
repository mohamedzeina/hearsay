'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/types';

interface DeleteButtonProps {
  action: () => Promise<ActionResult>;
  label?: string;
  confirmMessage?: string;
  onSuccess?: () => void;
  /** Fires when the confirm pill opens or closes, so parents can hide
   * sibling controls (e.g. an Edit button) for mutual exclusivity. */
  onConfirmingChange?: (confirming: boolean) => void;
}

export default function DeleteButton({
  action,
  label = 'Delete',
  confirmMessage = 'Are you sure?',
  onSuccess,
  onConfirmingChange,
}: DeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirmingState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const setConfirming = (next: boolean) => {
    setConfirmingState(next);
    onConfirmingChange?.(next);
  };

  const handleConfirm = async () => {
    setPending(true);
    const result = await action();
    if (!result.ok) {
      setError(result.message ?? 'Something went wrong.');
      setConfirming(false);
      setPending(false);
      return;
    }
    if (result.redirectTo) {
      router.push(result.redirectTo);
    }
    onSuccess?.();
  };

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-persimmon-soft border border-persimmon/30 pl-3 pr-1 py-1">
        <span className="text-[11px] font-medium text-persimmon-deep">
          {confirmMessage}
        </span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className="h-6 px-2.5 rounded-full bg-persimmon-deep text-white text-[11px] font-semibold hover:bg-persimmon transition-colors duration-150 motion-reduce:transition-none disabled:opacity-50"
        >
          {pending ? 'Deleting…' : 'Yes'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="h-6 px-2 rounded-full text-[11px] font-medium text-ink-2 hover:text-ink hover:bg-cream transition-colors duration-150 motion-reduce:transition-none disabled:opacity-50"
        >
          Cancel
        </button>
        {error && (
          <span className="text-[11px] font-medium text-persimmon-deep">{error}</span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={label}
      className="group inline-flex items-center gap-1 h-7 px-2 rounded-full text-xs font-medium text-ink-3 hover:text-persimmon-deep hover:bg-persimmon-soft transition-colors duration-150 motion-reduce:transition-none"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
      >
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
