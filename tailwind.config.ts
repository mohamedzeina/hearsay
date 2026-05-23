import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";
import typography from "@tailwindcss/typography";

// Brand persimmon. Single source for both the `persimmon` Tailwind colour
// and HeroUI's keyboard-focus ring — they must stay in lockstep.
const PERSIMMON = '#E5533D';

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    // HeroUI hoists @heroui/theme under nested packages with npm, so we need
    // both globs — the top-level one for pnpm/yarn layouts, the nested one
    // for npm. Without this, modal positioning classes get purged in prod
    // and modals render inline at the bottom instead of as an overlay.
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/**/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Core palette is driven by CSS variables defined in globals.css so
        // a single `.dark` class on <html> swaps the entire theme. The
        // `rgb(var(...) / <alpha-value>)` form is what lets Tailwind opacity
        // utilities like `bg-ink/40` keep working under variable-driven
        // colors — Tailwind splices the alpha into the `<alpha-value>` slot.
        cream: 'rgb(var(--cream-rgb) / <alpha-value>)',
        'cream-2': 'rgb(var(--cream-2-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2-rgb) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3-rgb) / <alpha-value>)',
        rule: 'rgb(var(--rule-rgb) / <alpha-value>)',
        'rule-2': 'rgb(var(--rule-2-rgb) / <alpha-value>)',
        persimmon: 'rgb(var(--persimmon-rgb) / <alpha-value>)',
        'persimmon-soft': 'rgb(var(--persimmon-soft-rgb) / <alpha-value>)',
        'persimmon-deep': 'rgb(var(--persimmon-deep-rgb) / <alpha-value>)',
        teal: 'rgb(var(--teal-rgb) / <alpha-value>)',
        'teal-soft': 'rgb(var(--teal-soft-rgb) / <alpha-value>)',
        // Topic chip palette — 8 hashed-by-slug tones. Each tone exposes
        // 50 (chip background), 500 (dot), 700 (label text). See topicTone()
        // in lib/utils.ts for the mapping. Token RGBs live in globals.css
        // so .dark can swap to dark-tinted pastels.
        'topic-terracotta': {
          50:  'rgb(var(--topic-terracotta-50-rgb) / <alpha-value>)',
          500: 'rgb(var(--topic-terracotta-500-rgb) / <alpha-value>)',
          700: 'rgb(var(--topic-terracotta-700-rgb) / <alpha-value>)',
        },
        'topic-sage': {
          50:  'rgb(var(--topic-sage-50-rgb) / <alpha-value>)',
          500: 'rgb(var(--topic-sage-500-rgb) / <alpha-value>)',
          700: 'rgb(var(--topic-sage-700-rgb) / <alpha-value>)',
        },
        'topic-plum': {
          50:  'rgb(var(--topic-plum-50-rgb) / <alpha-value>)',
          500: 'rgb(var(--topic-plum-500-rgb) / <alpha-value>)',
          700: 'rgb(var(--topic-plum-700-rgb) / <alpha-value>)',
        },
        'topic-teal': {
          50:  'rgb(var(--topic-teal-50-rgb) / <alpha-value>)',
          500: 'rgb(var(--topic-teal-500-rgb) / <alpha-value>)',
          700: 'rgb(var(--topic-teal-700-rgb) / <alpha-value>)',
        },
        'topic-mustard': {
          50:  'rgb(var(--topic-mustard-50-rgb) / <alpha-value>)',
          500: 'rgb(var(--topic-mustard-500-rgb) / <alpha-value>)',
          700: 'rgb(var(--topic-mustard-700-rgb) / <alpha-value>)',
        },
        'topic-periwinkle': {
          50:  'rgb(var(--topic-periwinkle-50-rgb) / <alpha-value>)',
          500: 'rgb(var(--topic-periwinkle-500-rgb) / <alpha-value>)',
          700: 'rgb(var(--topic-periwinkle-700-rgb) / <alpha-value>)',
        },
        'topic-rust': {
          50:  'rgb(var(--topic-rust-50-rgb) / <alpha-value>)',
          500: 'rgb(var(--topic-rust-500-rgb) / <alpha-value>)',
          700: 'rgb(var(--topic-rust-700-rgb) / <alpha-value>)',
        },
        'topic-rose': {
          50:  'rgb(var(--topic-rose-50-rgb) / <alpha-value>)',
          500: 'rgb(var(--topic-rose-500-rgb) / <alpha-value>)',
          700: 'rgb(var(--topic-rose-700-rgb) / <alpha-value>)',
        },
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(26, 22, 20, 0.04), 0 0 0 1px rgba(26, 22, 20, 0.04)',
        'lift': '0 4px 12px -2px rgba(26, 22, 20, 0.08), 0 2px 4px -2px rgba(26, 22, 20, 0.06)',
        'lift-lg': '0 12px 28px -6px rgba(26, 22, 20, 0.12), 0 6px 12px -4px rgba(26, 22, 20, 0.06)',
        'inset-rule': 'inset 0 0 0 1px #EAE4D7',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  darkMode: "class",
  // HeroUI's plugin ships its own tailwindcss type defs that don't unify with
  // ours — runtime is fine, just a type-only skew. Cast to keep tsc clean.
  plugins: [
    // Make HeroUI's focus ring use our brand persimmon instead of its default
    // blue. Inputs/textareas get a coherent persimmon halo on keyboard focus
    // that matches our border-persimmon focus state, so the two indicators
    // read as one designed focus look rather than competing colours.
    heroui({
      themes: {
        light: {
          colors: {
            focus: PERSIMMON,
          },
        },
      },
    }) as unknown as Config['plugins'],
    typography,
  ].flat() as Config['plugins'],
};
export default config;
