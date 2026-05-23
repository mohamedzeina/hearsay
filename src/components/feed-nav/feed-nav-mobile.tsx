'use client';

import { useScope, type Scope } from './scope-provider';

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'everywhere', label: 'Everywhere' },
  { id: 'following', label: 'Following' },
];

export default function FeedNavMobile() {
  const { scope: active, setScope } = useScope();

  return (
    <nav
      aria-label="Feed scope"
      className="lg:hidden mb-4 inline-flex items-center gap-1 rounded-full bg-cream-2 p-1 border border-rule"
    >
      {SCOPES.map((s) => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setScope(s.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex items-center h-8 px-3.5 rounded-full text-xs font-semibold transition-all duration-200 motion-reduce:transition-none ${
              isActive
                ? 'bg-surface text-ink shadow-soft'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}
