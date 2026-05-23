import { defineConfig, devices } from '@playwright/test';

// Dedicated config for the README screenshot pipeline. Lives separate
// from playwright.config.ts so the regular `test:e2e` / CI runs don't
// pick up the capture spec (no fast feedback in CI for it, and it
// resets + reseeds the test DB which would conflict with parallel runs).
//
// Run with: `npm run screenshots`
const PORT = 3101;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/screenshots',
  // Capture is sequential by design — sharing one signed-in browser
  // context, hitting localStorage to toggle themes between shots.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    // Animations off so the .rise stagger doesn't catch the camera
    // mid-fade — visited fade still applies via the !important class.
    launchOptions: { args: ['--force-prefers-reduced-motion'] },
  },
  projects: [
    {
      name: 'chromium',
      // Spread devices['Desktop Chrome'] FIRST, then override viewport
      // + deviceScaleFactor so our resolution wins. The reverse order
      // silently clobbered both back to the preset's 1280×720 @ 1x and
      // produced soft, non-retina PNGs.
      use: {
        ...devices['Desktop Chrome'],
        // 1440 × 900 reads as a "real laptop" composition in the
        // README hero. deviceScaleFactor 2 → retina-sharp PNGs at
        // 2880 × 1800 (and proportionally for the cropped shots).
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    // Next 15 auto-loads .env.test under NODE_ENV=test. PLAYWRIGHT_TEST=1
    // flips src/auth.ts to the credentials provider so we can sign in
    // headlessly without a real GitHub OAuth round-trip.
    command: `next dev -p ${PORT}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      PLAYWRIGHT_TEST: '1',
      NODE_ENV: 'test',
    },
  },
  globalSetup: './tests/screenshots/setup.ts',
});
