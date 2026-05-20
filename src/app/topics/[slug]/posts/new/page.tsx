'use client';

import { useFormState } from 'react-dom';
import { Input, Textarea } from '@nextui-org/react';
import FormButton from '@/components/common/formButton';
import FormError from '@/components/common/form-error';
import * as actions from '@/actions';
import Link from 'next/link';
import paths from '@/paths';
import { topicTone } from '@/lib/utils';
import SurfacePanel from '@/components/common/surface-panel';
import {
  inputClassNamesLg as inputClassNames,
  textareaClassNamesLg as textareaClassNames,
} from '@/lib/form-classes';

interface PostCreatePageProps {
  params: { slug: string };
}

export default function PostCreatePage({ params }: PostCreatePageProps) {
  const { slug } = params;
  const tone = topicTone(slug);
  const [formState, action] = useFormState(
    actions.createPost.bind(null, slug),
    { errors: {} }
  );

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-10">
      <Link
        href={paths.topicShow(slug)}
        className="group inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.14em] text-ink-2 hover:text-persimmon transition-colors duration-200 motion-reduce:transition-none mb-6"
      >
        <span aria-hidden className="transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none">&larr;</span>
        Back to <span className="lowercase">#{slug}</span>
      </Link>

      <SurfacePanel size="lg">
        <div className={`h-1.5 ${tone.dot}`} aria-hidden />

        <div className="px-6 sm:px-8 py-7 sm:py-8">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${tone.bg}`}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-5 h-5 ${tone.text}`}
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold tracking-tight text-2xl sm:text-3xl text-ink leading-tight">
                New post
              </h1>
              <p className="mt-1 text-sm text-ink-2">
                Posting to{' '}
                <Link
                  href={paths.topicShow(slug)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone.bg} ${tone.text} hover:shadow-soft transition-shadow duration-200 motion-reduce:transition-none`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                  <span className="lowercase">#{slug}</span>
                </Link>
              </p>
            </div>
          </div>

          <form action={action} className="flex flex-col gap-5 mt-7">
            <Input
              name="title"
              label="Title"
              labelPlacement="outside"
              placeholder="What's your post about?"
              isInvalid={!!formState.errors.title}
              errorMessage={formState.errors.title?.join(', ')}
              classNames={inputClassNames}
            />
            <Textarea
              name="content"
              label="Content"
              labelPlacement="outside"
              placeholder="Share your thoughts, questions, or ideas..."
              minRows={8}
              isInvalid={!!formState.errors.content}
              errorMessage={formState.errors.content?.join(', ')}
              classNames={textareaClassNames}
            />
            <FormError messages={formState.errors._form} />

            <div className="flex items-center justify-between pt-2 border-t border-rule">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-ink-3">
                Press publish when ready
              </p>
              <FormButton fullWidth={false}>Publish post</FormButton>
            </div>
          </form>
        </div>
      </SurfacePanel>
    </div>
  );
}
