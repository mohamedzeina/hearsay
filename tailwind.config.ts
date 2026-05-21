import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";
import typography from "@tailwindcss/typography";

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
        cream: '#FAF7F2',
        'cream-2': '#F2EDE3',
        surface: '#FFFFFF',
        ink: '#1A1614',
        'ink-2': '#5C544E',
        'ink-3': '#A8A29E',
        rule: '#EAE4D7',
        'rule-2': '#DDD5C5',
        persimmon: '#E5533D',
        'persimmon-soft': '#FBE8E3',
        'persimmon-deep': '#C2402B',
        teal: '#0F6E64',
        'teal-soft': '#DDEFEC',
        // Topic chip palette — 8 hashed-by-slug tones. Each tone exposes
        // 50 (chip background), 500 (dot), 700 (label text). See topicTone()
        // in lib/utils.ts for the mapping.
        'topic-terracotta': { 50: '#FDE8E0', 500: '#C25636', 700: '#9C3D24' },
        'topic-sage':       { 50: '#E4EBDF', 500: '#5F7A4D', 700: '#3F5733' },
        'topic-plum':       { 50: '#EDE2EE', 500: '#8A5790', 700: '#6B3D6E' },
        'topic-teal':       { 50: '#DBEDEB', 500: '#357973', 700: '#1F5A55' },
        'topic-mustard':    { 50: '#F5EDD3', 500: '#9A7B30', 700: '#6B5421' },
        'topic-periwinkle': { 50: '#E2E5F2', 500: '#5B679F', 700: '#3F4878' },
        'topic-rust':       { 50: '#F3DCC9', 500: '#A1582E', 700: '#7A3F1C' },
        'topic-rose':       { 50: '#F4E0E1', 500: '#A05A66', 700: '#7C3F49' },
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
            focus: '#E5533D',
          },
        },
      },
    }) as unknown as Config['plugins'],
    typography,
  ].flat() as Config['plugins'],
};
export default config;
