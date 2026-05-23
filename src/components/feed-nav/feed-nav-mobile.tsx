'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import paths from '@/paths';

type Scope = 'everywhere' | 'following';

const SCOPES: { id: Scope; label: string; href: string }[] = [
  { id: 'everywhere', label: 'Everywhere', href: paths.home() },
  { id: 'following', label: 'Following', href: paths.home({ view: 'following' }) },
];

export default function FeedNavMobile() {
  const searchParams = useSearchParams();
  const active: Scope = searchParams.get('view') === 'following' ? 'following' : 'everywhere';

  return (
    <nav
      aria-label="Feed scope"
      className="lg:hidden mb-4 inline-flex items-center gap-1 rounded-full bg-cream-2 p-1 border border-rule"
    >
      {SCOPES.map((scope) => {
        const isActive = scope.id === active;
        return (
          <Link
            key={scope.id}
            href={scope.href}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex items-center h-8 px-3.5 rounded-full text-xs font-semibold transition-all duration-200 motion-reduce:transition-none ${
              isActive
                ? 'bg-surface text-ink shadow-soft'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {scope.label}
          </Link>
        );
      })}
    </nav>
  );
}
