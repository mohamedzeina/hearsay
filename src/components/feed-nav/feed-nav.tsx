'use client';

import SurfacePanel from '@/components/common/surface-panel';
import { useScope, type Scope } from './scope-provider';

interface FeedNavProps {
  /** Total topics the viewer currently follows. Shown as a quiet count next to "Following". */
  followCount?: number;
}

const SCOPES: { id: Scope; label: string; hint: string }[] = [
  { id: 'everywhere', label: 'Everywhere', hint: 'All of Hearsay' },
  { id: 'following', label: 'Following', hint: 'Topics you follow' },
];

export default function FeedNav({ followCount }: FeedNavProps) {
  const { scope: active, setScope } = useScope();

  return (
    <SurfacePanel as="section">
      <header className="flex items-baseline justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-ink-3" />
          <h2 className="font-display font-bold text-sm text-ink">Your feed</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
          Scope
        </span>
      </header>
      <hr className="border-0 h-px bg-rule" />
      <nav aria-label="Feed scope" className="p-1.5">
        <ul className="flex flex-col gap-0.5">
          {SCOPES.map((s) => {
            const isActive = s.id === active;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setScope(s.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group w-full flex items-center justify-between gap-3 rounded-xl border-l-2 pl-3 pr-2.5 py-2 text-sm text-left transition-colors duration-150 motion-reduce:transition-none ${
                    isActive
                      ? 'border-persimmon bg-cream-2/70 text-ink'
                      : 'border-transparent text-ink-2 hover:text-ink hover:bg-cream-2/50'
                  }`}
                >
                  <span className="flex flex-col min-w-0">
                    <span className="font-display font-bold text-[0.95rem] leading-tight text-ink">
                      {s.label}
                    </span>
                    <span className="text-[11px] text-ink-2 leading-tight mt-0.5">
                      {s.hint}
                    </span>
                  </span>
                  {s.id === 'following' &&
                    typeof followCount === 'number' &&
                    followCount > 0 && (
                      <span
                        className={`shrink-0 inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-[10px] font-mono font-semibold ${
                          isActive
                            ? 'bg-persimmon-soft text-persimmon-deep'
                            : 'bg-cream-2 text-ink-2'
                        }`}
                      >
                        {followCount}
                      </span>
                    )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </SurfacePanel>
  );
}
