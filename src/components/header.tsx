import Link from 'next/link';
import SearchInput from './search-input';
import HeaderAuth from './header-auth';
import Notifications from './notifications/notifications';
import { Suspense } from 'react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50">
      {/* Brand hairline — couture-edge accent */}
      <div className="h-[3px] bg-persimmon" aria-hidden />

      <div className="border-b border-rule bg-cream/85 backdrop-blur supports-[backdrop-filter]:bg-cream/70">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 sm:gap-4 h-[var(--nav-h)]">
            {/* Brand — left */}
            <Link
              href="/"
              className="group flex items-baseline gap-1.5 shrink-0"
              aria-label="Hearsay home"
            >
              <span
                aria-hidden
                className="relative inline-flex items-center justify-center w-8 h-8 rounded-xl bg-ink text-cream transition-transform duration-200 group-hover:-rotate-3 motion-reduce:transition-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path d="M9.5 6H6.2C5 6 4 7 4 8.2v3.3C4 12.8 5 13.8 6.2 13.8h1.6c-.1 1.6-1.1 2.7-2.4 3.4l1.2 1.6c2.1-1 4-2.8 4-6.3V8.2C10.6 7 9.6 6 8.4 6h1.1zm9 0h-3.3c-1.2 0-2.2 1-2.2 2.2v3.3c0 1.3 1 2.3 2.2 2.3h1.6c-.1 1.6-1.1 2.7-2.4 3.4l1.2 1.6c2.1-1 4-2.8 4-6.3V8.2c0-1.2-1-2.2-2.2-2.2h1.1z" />
                </svg>
              </span>
              <span className="font-display font-extrabold text-xl tracking-tight text-ink leading-none">
                hearsay
                <span className="inline-block text-persimmon origin-bottom-left transition-transform duration-200 group-hover:scale-[1.6] motion-reduce:transition-none">
                  .
                </span>
              </span>
            </Link>

            {/* Search — horizontally centered between brand and auth */}
            <div className="flex-1 flex justify-center min-w-0">
              <div className="w-full max-w-md">
                <Suspense>
                  <SearchInput />
                </Suspense>
              </div>
            </div>

            {/* Notifications + auth — right */}
            <div className="shrink-0 flex items-center gap-2 sm:gap-3">
              <Suspense fallback={null}>
                <Notifications />
              </Suspense>
              <HeaderAuth />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
