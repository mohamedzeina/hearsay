'use client';

import { NextUIProvider } from '@nextui-org/react';
import { SessionProvider } from 'next-auth/react';
import SignInPromptProvider from '@/components/auth/signin-prompt';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <NextUIProvider>
        <SignInPromptProvider>{children}</SignInPromptProvider>
      </NextUIProvider>
    </SessionProvider>
  );
}
