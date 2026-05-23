'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type Scope = 'everywhere' | 'following';

interface ScopeContextValue {
  scope: Scope;
  setScope: (next: Scope) => void;
  /** False when the viewer is signed out — Following is invisible to them. */
  canFollow: boolean;
}

const ScopeContext = createContext<ScopeContextValue | null>(null);

export function useScope(): ScopeContextValue {
  const ctx = useContext(ScopeContext);
  if (!ctx) {
    throw new Error('useScope must be used inside <ScopeProvider />');
  }
  return ctx;
}

interface ScopeProviderProps {
  initialScope: Scope;
  canFollow: boolean;
  children: React.ReactNode;
}

/**
 * Owns the home page's feed scope (Everywhere / Following). Scope is kept
 * in client state so swapping is instant; the URL is mirrored via
 * `history.replaceState` so deep links and back/forward keep working
 * without telling Next's router to re-fetch the page.
 */
export function ScopeProvider({
  initialScope,
  canFollow,
  children,
}: ScopeProviderProps) {
  const [scope, setScopeState] = useState<Scope>(initialScope);

  // Browser back/forward should still toggle the active scope.
  useEffect(() => {
    function onPop() {
      const params = new URLSearchParams(window.location.search);
      const next: Scope =
        params.get('view') === 'following' && canFollow
          ? 'following'
          : 'everywhere';
      setScopeState(next);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [canFollow]);

  const setScope = useCallback((next: Scope) => {
    setScopeState(next);
    const url = new URL(window.location.href);
    if (next === 'following') {
      url.searchParams.set('view', 'following');
    } else {
      url.searchParams.delete('view');
    }
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, []);

  return (
    <ScopeContext.Provider value={{ scope, setScope, canFollow }}>
      {children}
    </ScopeContext.Provider>
  );
}
