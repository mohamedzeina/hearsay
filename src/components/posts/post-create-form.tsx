'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import paths from '@/paths';
import { IconPencil } from '@/components/icons';
import { PrimaryButton } from '@/components/common/primary-button';
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
    <PrimaryButton type="button" onClick={onClick} fullWidth>
      <IconPencil strokeWidth={2.2} className="w-4 h-4" />
      Write a post
      <span
        aria-hidden
        className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
      >
        &rarr;
      </span>
    </PrimaryButton>
  );
}
