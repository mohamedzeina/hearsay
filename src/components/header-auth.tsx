'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  IconBookmark,
  IconChevronDown,
  IconSignOut,
  IconSpinner,
} from '@/components/icons';
import Avatar from '@/components/common/avatar';
import { PrimaryButton } from '@/components/common/primary-button';
import paths from '@/paths';

export default function HeaderAuth() {
  const session = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authPending, setAuthPending] = useState<'in' | 'out' | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (session.status === 'loading') {
    return <div className="w-9 h-9 rounded-full bg-rule animate-pulse" />;
  }

  if (session.data?.user) {
    const user = session.data.user;
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="group flex items-center gap-2 rounded-full p-0.5 pr-3 bg-surface border border-rule hover:border-rule-2 hover:shadow-soft transition-all duration-200 motion-reduce:transition-none"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Avatar user={user} size="md" ring="none" />
          <span className="hidden md:inline text-sm font-medium text-ink max-w-[120px] truncate">
            {user.name}
          </span>
          <IconChevronDown className={`w-3.5 h-3.5 text-ink-2 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-2 w-64 bg-surface border border-rule rounded-2xl shadow-lift-lg z-50 rise overflow-hidden"
            role="menu"
          >
            <div className="px-4 py-3 border-b border-rule bg-cream-2/40">
              <p className="text-xs font-mono uppercase tracking-wide text-ink-2 mb-0.5">
                Signed in as
              </p>
              <p className="font-semibold text-sm text-ink truncate">{user.name}</p>
              <p className="text-xs text-ink-2 truncate font-mono">{user.email}</p>
            </div>
            <Link
              href={paths.savedPosts()}
              onClick={() => setOpen(false)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink hover:bg-persimmon-soft hover:text-persimmon-deep transition-colors duration-150 motion-reduce:transition-none border-b border-rule"
              role="menuitem"
            >
              <span className="flex items-center gap-2">
                <IconBookmark className="w-4 h-4" />
                Saved posts
              </span>
              <span aria-hidden className="text-ink-3">&rarr;</span>
            </Link>
            <button
              onClick={() => {
                setAuthPending('out');
                signOut({ callbackUrl: '/' });
              }}
              disabled={authPending === 'out'}
              aria-busy={authPending === 'out'}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink hover:bg-persimmon-soft hover:text-persimmon-deep disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-150 motion-reduce:transition-none"
              role="menuitem"
            >
              <span className="flex items-center gap-2">
                {authPending === 'out' ? (
                  <IconSpinner className="w-4 h-4" />
                ) : (
                  <IconSignOut className="w-4 h-4" />
                )}
                {authPending === 'out' ? 'Signing out…' : 'Sign out'}
              </span>
              <span aria-hidden className="text-ink-3">&rarr;</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (pathname === '/auth/signin') return null;

  return (
    <PrimaryButton
      onClick={() => {
        setAuthPending('in');
        signIn();
      }}
      disabled={authPending === 'in'}
      aria-busy={authPending === 'in'}
    >
      {authPending === 'in' ? (
        <>
          <IconSpinner className="w-4 h-4" />
          <span>Signing in&hellip;</span>
        </>
      ) : (
        <>
          Sign in
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">&rarr;</span>
        </>
      )}
    </PrimaryButton>
  );
}
