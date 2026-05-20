'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import paths from '@/paths';
import { IconPencil } from '@/components/icons';
import { useSignInPrompt } from '@/components/auth/signin-prompt';

interface PostCreateFormProps {
  slug: string;
}

export default function PostCreateForm({ slug }: PostCreateFormProps) {
  const router = useRouter();
  const session = useSession();
  const signInPrompt = useSignInPrompt();

  const onClick = () => {
    if (session.status !== 'authenticated') {
      signInPrompt.open('Sign in to start a post.');
      return;
    }
    router.push(paths.postCreate(slug));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon active:scale-[0.99] transition-all duration-200 motion-reduce:transition-none shadow-soft"
    >
      <IconPencil strokeWidth={2.2} className="w-4 h-4" />
      Write a post
      <span
        aria-hidden
        className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
      >
        &rarr;
      </span>
    </button>
  );
}
