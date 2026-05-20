import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
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
  plugins: [nextui(), typography],
};
export default config;
