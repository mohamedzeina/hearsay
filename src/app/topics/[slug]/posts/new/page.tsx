'use client';

import { use, useActionState, useEffect } from 'react';
import { Input, Textarea } from '@heroui/react';
import { useRouter } from 'next/navigation';
import FormButton from '@/components/common/form-button';
import FormError from '@/components/common/form-error';
import * as actions from '@/actions';
import Link from 'next/link';
import paths from '@/paths';
import { topicTone } from '@/lib/utils';
import SurfacePanel from '@/components/common/surface-panel';
import { IconPencil } from '@/components/icons';
import {
  fieldError,
  formMessage,
  INITIAL_ACTION_STATE,
} from '@/lib/types';
import {
  inputClassNamesLg as inputClassNames,
  textareaClassNamesLg as textareaClassNames,
} from '@/lib/form-classes';

interface PostCreatePageProps {
  params: Promise<{ slug: string }>;
}

export default function PostCreatePage({ params }: PostCreatePageProps) {
  const { slug } = use(params);
  const tone = topicTone(slug);
  const router = useRouter();
  const [formState, action] = useActionState(
    actions.createPost.bind(null, slug),
    INITIAL_ACTION_STATE
  );

  useEffect(() => {
    if (formState.ok && formState.redirectTo) {
      router.push(formState.redirectTo);
    }
  }, [formState, router]);

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
              <IconPencil className={`w-5 h-5 ${tone.text}`} />
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
              isInvalid={!!fieldError(formState, 'title')}
              errorMessage={fieldError(formState, 'title')?.join(', ')}
              classNames={inputClassNames}
            />
            <Textarea
              name="content"
              label="Content"
              labelPlacement="outside"
              placeholder="Share your thoughts, questions, or ideas..."
              minRows={8}
              isInvalid={!!fieldError(formState, 'content')}
              errorMessage={fieldError(formState, 'content')?.join(', ')}
              classNames={textareaClassNames}
            />
            <FormError message={formMessage(formState)} />

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
