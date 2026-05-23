'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import FormButton from '@/components/common/form-button';
import FormError from '@/components/common/form-error';
import CharCounter from '@/components/common/char-counter';
import { PrimaryButton } from '@/components/common/primary-button';
import MentionTextarea from '@/components/mentions/mention-textarea';
import * as actions from '@/actions';
import SurfacePanel from '@/components/common/surface-panel';
import { IconReply } from '@/components/icons';
import { inputClassNames as textareaClassNames } from '@/lib/form-classes';
import { COMMENT_CONTENT } from '@/lib/form-limits';
import {
  fieldError,
  formMessage,
  INITIAL_ACTION_STATE,
} from '@/lib/types';
import { useSignInPrompt } from '@/components/auth/signin-prompt';
import { useDraft } from '@/lib/use-draft';

interface CommentCreateFormProps {
  postId: string;
  parentId?: string;
  startOpen?: boolean;
}

export default function CommentCreateForm({
  postId,
  parentId,
  startOpen,
}: CommentCreateFormProps) {
  const [open, setOpen] = useState(startOpen);
  const ref = useRef<HTMLFormElement | null>(null);
  const session = useSession();
  const signInPrompt = useSignInPrompt();
  const isAuthed = session.status === 'authenticated';
  const draftKey = parentId ? `reply:${parentId}` : `comment:${postId}`;
  const draft = useDraft(draftKey);
  const [formState, action] = useActionState(
    actions.createComment.bind(null, { postId, parentId }),
    INITIAL_ACTION_STATE
  );

  useEffect(() => {
    if (formState.ok) {
      ref.current?.reset();
      draft.clear();
      if (!startOpen) {
        setOpen(false);
      }
    }
  }, [formState.ok, startOpen, draft]);

  const form = (
    <form action={action} ref={ref}>
      <div className="space-y-3">
        <MentionTextarea
          name="content"
          placeholder={
            startOpen ? 'Share your thoughts...' : 'Write a reply...'
          }
          minRows={startOpen ? 3 : 2}
          value={draft.value}
          onValueChange={draft.setValue}
          isInvalid={!!fieldError(formState, 'content')}
          errorMessage={fieldError(formState, 'content')?.join(', ')}
          classNames={textareaClassNames}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3">
            Be kind &middot; be curious
          </p>
          <CharCounter
            current={draft.value.length}
            min={COMMENT_CONTENT.min}
            max={COMMENT_CONTENT.max}
          />
        </div>

        <FormError message={formMessage(formState)} />

        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            {!startOpen && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 px-3 rounded-full text-sm font-medium text-ink-2 hover:text-ink hover:bg-cream-2 transition-colors duration-150 motion-reduce:transition-none"
              >
                Cancel
              </button>
            )}
            <FormButton fullWidth={false}>
              {startOpen ? 'Post reply' : 'Reply'}
            </FormButton>
          </div>
        </div>
      </div>
    </form>
  );

  if (startOpen) {
    return (
      <SurfacePanel as="section" aria-label="Leave a reply">
        <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-rule">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-persimmon" />
            <h2 className="font-display font-bold text-sm text-ink">
              Add to the discussion
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Markdown supported
          </span>
        </header>
        <div className="p-5">
          {session.status === 'unauthenticated' ? (
            <SignInToReplyCTA
              onClick={() => signInPrompt.open('Sign in to join the discussion.')}
            />
          ) : (
            form
          )}
        </div>
      </SurfacePanel>
    );
  }

  return (
    <div className={open ? 'basis-full w-full' : ''}>
      {!open && (
        <button
          type="button"
          onClick={() => {
            if (!isAuthed) {
              signInPrompt.open('Sign in to reply.');
              return;
            }
            setOpen(true);
          }}
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
        >
          <IconReply className="w-3.5 h-3.5" />
          Reply
        </button>
      )}
      {open && <div className="mt-1">{form}</div>}
    </div>
  );
}

function SignInToReplyCTA({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 py-2">
      <p className="text-sm text-ink-2 leading-relaxed">
        Got something to add? Sign in and join the thread.
      </p>
      <PrimaryButton type="button" onClick={onClick}>
        Sign in to reply
        <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">&rarr;</span>
      </PrimaryButton>
    </div>
  );
}
