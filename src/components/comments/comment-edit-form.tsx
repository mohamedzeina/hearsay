'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Textarea } from '@heroui/react';
import * as actions from '@/actions';
import FormButton from '@/components/common/form-button';
import FormError from '@/components/common/form-error';
import CharCounter from '@/components/common/char-counter';
import { inputClassNames as textareaClassNames } from '@/lib/form-classes';
import { COMMENT_CONTENT } from '@/lib/form-limits';
import {
  fieldError,
  formMessage,
  INITIAL_ACTION_STATE,
} from '@/lib/types';

interface CommentEditFormProps {
  commentId: string;
  initialContent: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CommentEditForm({
  commentId,
  initialContent,
  onCancel,
  onSuccess,
}: CommentEditFormProps) {
  const ref = useRef<HTMLFormElement | null>(null);
  const [contentLength, setContentLength] = useState(initialContent.length);
  const [formState, action] = useActionState(
    actions.editComment.bind(null, commentId),
    INITIAL_ACTION_STATE
  );

  useEffect(() => {
    if (formState.ok) {
      onSuccess();
    }
  }, [formState.ok, onSuccess]);

  return (
    <form action={action} ref={ref} className="space-y-3">
      <Textarea
        name="content"
        defaultValue={initialContent}
        minRows={3}
        onValueChange={(v) => setContentLength(v.length)}
        isInvalid={!!fieldError(formState, 'content')}
        errorMessage={fieldError(formState, 'content')?.join(', ')}
        classNames={textareaClassNames}
      />
      <div className="flex items-center justify-end">
        <CharCounter
          current={contentLength}
          min={COMMENT_CONTENT.min}
          max={COMMENT_CONTENT.max}
        />
      </div>
      <FormError message={formMessage(formState)} />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-3 rounded-full text-sm font-medium text-ink-2 hover:text-ink hover:bg-cream-2 transition-colors duration-150 motion-reduce:transition-none"
        >
          Cancel
        </button>
        <FormButton fullWidth={false}>Save</FormButton>
      </div>
    </form>
  );
}
