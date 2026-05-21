'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Input, Textarea } from '@heroui/react';
import * as actions from '@/actions';
import Avatar from '@/components/common/avatar';
import DeleteButton from '@/components/common/delete-button';
import FormButton from '@/components/common/form-button';
import FormError from '@/components/common/form-error';
import Markdown from '@/components/common/markdown';
import { IconPencil } from '@/components/icons';
import paths from '@/paths';
import { resolveAuthorSlug, timeAgo } from '@/lib/utils';
import {
  fieldError,
  formMessage,
  INITIAL_ACTION_STATE,
} from '@/lib/types';
import {
  inputClassNamesLg,
  textareaClassNamesLg,
} from '@/lib/form-classes';

interface PostEditableProps {
  postId: string;
  initialTitle: string;
  initialContent: string;
  isOwner: boolean;
  author: { name: string | null; image: string | null; username: string | null };
  createdAt: Date;
  editedAt: Date | null;
}

export default function PostEditable({
  postId,
  initialTitle,
  initialContent,
  isOwner,
  author,
  createdAt,
  editedAt,
}: PostEditableProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [formState, action] = useActionState(
    actions.editPost.bind(null, postId),
    INITIAL_ACTION_STATE
  );

  useEffect(() => {
    if (formState.ok) {
      setEditing(false);
    }
  }, [formState.ok]);

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (editing) {
    return (
      <form action={action} className="flex flex-col gap-5">
        <Input
          name="title"
          label="Title"
          labelPlacement="outside"
          defaultValue={initialTitle}
          isInvalid={!!fieldError(formState, 'title')}
          errorMessage={fieldError(formState, 'title')?.join(', ')}
          classNames={inputClassNamesLg}
        />
        <Textarea
          name="content"
          label="Content"
          labelPlacement="outside"
          defaultValue={initialContent}
          minRows={8}
          isInvalid={!!fieldError(formState, 'content')}
          errorMessage={fieldError(formState, 'content')?.join(', ')}
          classNames={textareaClassNamesLg}
        />
        <FormError message={formMessage(formState)} />
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-rule">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-ink-3">
            Tidy up &middot; not rewrite
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-10 px-4 rounded-full text-sm font-medium text-ink-2 hover:text-ink hover:bg-cream-2 transition-colors duration-150 motion-reduce:transition-none"
            >
              Cancel
            </button>
            <FormButton fullWidth={false}>Save changes</FormButton>
          </div>
        </div>
      </form>
    );
  }

  return (
    <>
      {isOwner && (
        <div className="flex justify-end items-center gap-1 mb-2 min-h-[1.75rem]">
          {!confirmingDelete && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
            >
              <IconPencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          <DeleteButton
            action={actions.deletePost.bind(null, postId)}
            confirmMessage="Delete post?"
            onConfirmingChange={setConfirmingDelete}
          />
        </div>
      )}
      <h1 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl text-ink leading-[1.1]">
        {initialTitle}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-2">
        <AuthorMeta author={author} />
        <span className="w-1 h-1 rounded-full bg-ink-3" aria-hidden />
        <time
          dateTime={new Date(createdAt).toISOString()}
          className="font-mono num-plate text-xs"
        >
          {formattedDate}
        </time>
        <span
          className="w-1 h-1 rounded-full bg-ink-3 hidden sm:inline-block"
          aria-hidden
        />
        <span
          className="font-mono text-xs text-ink-3 hidden sm:inline"
          suppressHydrationWarning
        >
          {timeAgo(createdAt)}
        </span>
        {editedAt && (
          <>
            <span className="w-1 h-1 rounded-full bg-ink-3" aria-hidden />
            <span
              className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3 italic"
              title={`Edited ${new Date(editedAt).toLocaleString()}`}
              suppressHydrationWarning
            >
              edited {timeAgo(editedAt)}
            </span>
          </>
        )}
      </div>

      <div className="mt-6 h-px bg-rule" />

      <Markdown content={initialContent} variant="body" className="mt-6" />
    </>
  );
}

function AuthorMeta({
  author,
}: {
  author: { name: string | null; image: string | null; username: string | null };
}) {
  const display = author.name ?? 'anon';
  const slug = resolveAuthorSlug(author);
  if (!slug) {
    return (
      <div className="flex items-center gap-2">
        <Avatar user={author} size="sm" />
        <span className="font-semibold text-ink">{display}</span>
      </div>
    );
  }
  return (
    <Link
      href={paths.userProfile(slug)}
      className="flex items-center gap-2 rounded-full -mx-1 px-1 py-0.5 hover:bg-cream-2/60 transition-colors duration-150 motion-reduce:transition-none"
    >
      <Avatar user={author} size="sm" />
      <span className="font-semibold text-ink hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none">
        {display}
      </span>
    </Link>
  );
}
