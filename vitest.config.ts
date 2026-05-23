import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const alias = { '@': path.resolve(__dirname, './src') };

export default defineConfig({
  resolve: { alias },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/page.tsx',
        // Skeleton + home-skeleton are pure presentational chrome — they
        // surface for ~ms during route transitions and have no logic worth
        // instrumenting.
        'src/app/**/*-skeleton.tsx',
        'src/app/**/loading-*.tsx',
      ],
      // Baseline thresholds — set a few points below the current numbers
      // so PRs that meaningfully drop coverage fail, but routine edits to
      // already-covered code don't trip on rounding. Bump these as the
      // codebase tightens.
      thresholds: {
        statements: 60,
        branches: 80,
        functions: 70,
        lines: 60,
      },
    },
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: [
            'tests/unit/**/*.test.{ts,tsx}',
            'tests/components/**/*.test.{ts,tsx}',
          ],
          css: false,
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          environment: 'node',
          globals: true,
          setupFiles: ['./tests/integration/setup.ts'],
          include: ['tests/integration/**/*.test.{ts,tsx}'],
          pool: 'forks',
          poolOptions: { forks: { singleFork: true } },
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
