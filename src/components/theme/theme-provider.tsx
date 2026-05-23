'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider />');
  }
  return ctx;
}

const STORAGE_KEY = 'hearsay:theme';

function readInitialTheme(): Theme {
  // The first-paint script in layout.tsx already wrote the class. Read it
  // back so the React state starts in sync with the DOM and we don't flash
  // a wrong-theme toggle icon for one frame.
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // The server renders in "light" (no DOM yet). The first-paint script
  // applies `.dark` on the real document before React hydrates, then we
  // sync state via the effect below — hydration always matches.
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(readInitialTheme());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Disabled / quota-full storage (Safari private mode) — degrades to
      // session-only theme. Not worth surfacing.
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Inline first-paint script source. Stringified and injected into the
 * <head> via dangerouslySetInnerHTML in layout.tsx so the `.dark` class
 * lands on <html> before any styles or React render — no light-flash on
 * a dark-preference user's first paint.
 */
export const themeBootScript = `
(function() {
  try {
    var saved = localStorage.getItem('${STORAGE_KEY}');
    var dark = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`.trim();
