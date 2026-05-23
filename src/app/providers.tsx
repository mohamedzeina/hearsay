'use client';

import { HeroUIProvider } from '@heroui/react';
import { SessionProvider } from 'next-auth/react';
import SignInPromptProvider from '@/components/auth/signin-prompt';
import ToastProvider from '@/components/common/toast';
import ThemeProvider from '@/components/theme/theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <ThemeProvider>
          <SignInPromptProvider>
            <ToastProvider>{children}</ToastProvider>
          </SignInPromptProvider>
        </ThemeProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
