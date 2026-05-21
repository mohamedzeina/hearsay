'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { Textarea } from '@nextui-org/react';
import * as actions from '@/actions';
import FormButton from '@/components/common/formButton';
import FormError from '@/components/common/form-error';
import { inputClassNames as textareaClassNames } from '@/lib/form-classes';

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
  const [formState, action] = useFormState(
    actions.editComment.bind(null, commentId),
    { errors: {} }
  );

  useEffect(() => {
    if (formState.success) {
      onSuccess();
    }
  }, [formState.success, onSuccess]);

  return (
    <form action={action} ref={ref} className="space-y-3">
      <Textarea
        name="content"
        defaultValue={initialContent}
        minRows={3}
        isInvalid={!!formState.errors.content}
        errorMessage={formState.errors.content?.join(', ')}
        classNames={textareaClassNames}
      />
      <FormError messages={formState.errors._form} />
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
