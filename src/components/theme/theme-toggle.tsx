'use client';

import { useTheme } from './theme-provider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-ink-2 hover:text-ink hover:bg-cream-2 transition-colors duration-150 motion-reduce:transition-none"
    >
      {/* Sun (visible in dark mode) / Moon (visible in light) — cross-fade
          via opacity so the swap reads as a single iconographic moment
          rather than two icons fighting. */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute w-[18px] h-[18px] transition-opacity duration-200 motion-reduce:transition-none ${
          isDark ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Crescent moon */}
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute w-[18px] h-[18px] transition-opacity duration-200 motion-reduce:transition-none ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Sun */}
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    </button>
  );
}
