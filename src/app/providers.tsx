'use client';

import { HeroUIProvider } from '@heroui/react';
import { SessionProvider } from 'next-auth/react';
import SignInPromptProvider from '@/components/auth/signin-prompt';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <SignInPromptProvider>{children}</SignInPromptProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
