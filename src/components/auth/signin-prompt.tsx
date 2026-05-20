'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
} from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from '@nextui-org/react';
import { signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { IconSpinner } from '@/components/icons';

interface SignInPromptCtx {
  open: (reason?: string) => void;
}

const Ctx = createContext<SignInPromptCtx | null>(null);

export function useSignInPrompt(): SignInPromptCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useSignInPrompt must be used inside SignInPromptProvider');
  }
  return ctx;
}

export default function SignInPromptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [reason, setReason] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();

  const open = useCallback(
    (r?: string) => {
      setReason(r ?? null);
      onOpen();
    },
    [onOpen]
  );

  const handleGithub = () => {
    startTransition(() => {
      signIn('github', { callbackUrl: pathname || '/' });
    });
  };

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        size="sm"
        classNames={{
          base: 'rounded-2xl border border-rule bg-surface shadow-lift-lg',
          backdrop: 'bg-ink/40 backdrop-blur-sm',
          closeButton: 'top-3 right-3 text-ink-2 hover:bg-cream-2',
        }}
      >
        <ModalContent>
          <ModalBody className="p-0">
            <div className="h-1.5 bg-persimmon" aria-hidden />
            <div className="px-6 pt-6 pb-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
                Step into the room
              </p>
              <h2 className="font-display font-extrabold text-2xl text-ink leading-tight tracking-tight">
                Sign in to continue
              </h2>
              {reason && (
                <p className="mt-2 text-sm text-ink-2 leading-relaxed">
                  {reason}
                </p>
              )}
            </div>
            <div className="px-6 pt-3 pb-6">
              <button
                type="button"
                onClick={handleGithub}
                disabled={pending}
                aria-busy={pending}
                className="group relative w-full h-11 rounded-full bg-ink text-cream font-semibold overflow-hidden active:scale-[0.99] disabled:active:scale-100 disabled:opacity-80 disabled:cursor-not-allowed transition-transform duration-150 motion-reduce:transition-none shadow-soft"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-persimmon translate-y-full group-hover:translate-y-0 group-disabled:translate-y-full transition-transform duration-300 ease-out motion-reduce:transition-none"
                />
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {pending ? (
                    <>
                      <IconSpinner className="w-4 h-4" />
                      <span>Connecting to GitHub&hellip;</span>
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 fill-current"
                        aria-hidden
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      Continue with GitHub
                    </>
                  )}
                </span>
              </button>
              <p className="mt-3 text-center text-[11px] font-mono uppercase tracking-[0.12em] text-ink-3">
                Just one tap &middot; no email, no password
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Ctx.Provider>
  );
}
