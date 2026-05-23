import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const OUT_DIR = resolve(__dirname, '../../docs/screenshots');
const OWNER_EMAIL = 'screenshots-owner@example.com';

/**
 * Programmatic sign-in via the test credentials provider gated by
 * PLAYWRIGHT_TEST=1 in src/auth.ts. Avoids driving the GitHub OAuth
 * pop-up. The csrf token + form-encoded POST mirrors what
 * `/api/auth/signin/credentials` posts under the hood.
 */
async function signIn(page: Page) {
  const csrfResp = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfResp.json();
  await page.request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken,
      email: OWNER_EMAIL,
      callbackUrl: '/',
      json: 'true',
    },
  });
  // Land us on home with the session cookie set.
  await page.goto('/');
  await expect(page.getByText(/welcome back/i)).toBeVisible();
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    localStorage.setItem('hearsay:theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, theme);
}

/**
 * Hide Next.js dev-mode chrome (the "N" build indicator + error overlay
 * portals) so the screenshots don't tell on themselves about being run
 * against `next dev`.
 */
async function hideDevChrome(page: Page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-next-mark],
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay],
      #__next-build-watcher { display: none !important; }
    `,
  });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await mkdir(OUT_DIR, { recursive: true });
});

test('hero-light + hero-dark — signed-in home with the full sidebar', async ({
  page,
}) => {
  await signIn(page);

  // Light hero.
  await setTheme(page, 'light');
  await page.goto('/');
  await expect(page.getByText(/welcome back/i)).toBeVisible();
  // Make sure the post feed has hydrated before we shoot.
  await expect(page.locator('ul li').first()).toBeVisible();
  await hideDevChrome(page);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: resolve(OUT_DIR, 'hero-light.png'),
    fullPage: false,
  });

  // Dark hero — same page, just flipped.
  await setTheme(page, 'dark');
  await hideDevChrome(page);
  // Allow the CSS transitions to settle so we don't catch a mid-swap frame.
  await page.waitForTimeout(400);
  await page.screenshot({
    path: resolve(OUT_DIR, 'hero-dark.png'),
    fullPage: false,
  });

  // Reset to light for the rest of the captures.
  await setTheme(page, 'light');
});

test('feature-scope-nav — sidebar "Your feed" panel cropped', async ({
  page,
}) => {
  await signIn(page);
  await setTheme(page, 'light');
  await page.goto('/');
  // FeedNavMobile uses the same aria-label but is rendered first in
  // DOM order — and lg:hidden makes it invisible at 1440px. Scope to
  // the sidebar nav by requiring its <section> SurfacePanel ancestor.
  const feedNav = page.locator('section nav[aria-label="Feed scope"]');
  await expect(feedNav).toBeVisible();
  const panel = feedNav.locator('xpath=ancestor::section[1]');
  await panel.screenshot({
    path: resolve(OUT_DIR, 'feature-scope-nav.png'),
  });
});

test('feature-toast — Saved · Tucked away in /saved. with Undo', async ({
  page,
}) => {
  await signIn(page);
  await setTheme(page, 'light');
  await page.goto('/');

  // Find the first unsaved post-card bookmark, click it, wait for toast.
  const unsaved = page.getByRole('button', { name: 'Save post' }).first();
  await expect(unsaved).toBeVisible();
  await unsaved.click();

  const toast = page.getByTestId('toast');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText(/saved/i);
  // Let the enter transition finish (200ms) so the toast lands at
  // opacity-100 and translate-y-0 before we capture.
  await page.waitForTimeout(260);

  // Capture a bottom-right slice of the viewport that frames the toast
  // with a bit of breathing room.
  const vp = page.viewportSize();
  if (!vp) throw new Error('viewport missing');
  await page.screenshot({
    path: resolve(OUT_DIR, 'feature-toast.png'),
    clip: { x: vp.width - 480, y: vp.height - 200, width: 470, height: 190 },
  });
});

test('feature-post-detail — markdown + comments + sidebar', async ({
  page,
}) => {
  await signIn(page);
  await setTheme(page, 'light');
  await page.goto('/');

  // Click into the first post card on the home feed.
  const firstPost = page.locator('ul li').first().locator('a[href*="/posts/"]');
  await firstPost.click();
  // Wait for the post show to hydrate.
  await expect(page.locator('article').first()).toBeVisible();
  await hideDevChrome(page);
  await page.waitForTimeout(500);

  await page.screenshot({
    path: resolve(OUT_DIR, 'feature-post-detail.png'),
    fullPage: false,
  });
});

test('feature-mentions — @ autocomplete dropdown open', async ({ page }) => {
  await signIn(page);
  await setTheme(page, 'light');
  await page.goto('/');

  // Open the first post detail to get a reply textarea.
  const firstPost = page.locator('ul li').first().locator('a[href*="/posts/"]');
  await firstPost.click();
  await page.waitForLoadState('networkidle');

  // The top-level reply textarea starts open on the post detail page.
  const textarea = page.getByRole('textbox').first();
  await textarea.click();
  await textarea.fill('');
  // Single character after @ triggers the prefix-matched suggestion list.
  await textarea.type('hey @m');
  // Wait for the portaled dropdown.
  const listbox = page.locator('[role="listbox"]');
  await expect(listbox).toBeVisible({ timeout: 5000 });

  // Capture the textarea + dropdown by getting their combined bounding box.
  const taBox = await textarea.boundingBox();
  const lbBox = await listbox.boundingBox();
  if (!taBox || !lbBox) throw new Error('bounding boxes missing');
  const x = Math.min(taBox.x, lbBox.x) - 12;
  const y = Math.min(taBox.y, lbBox.y) - 12;
  const right = Math.max(taBox.x + taBox.width, lbBox.x + lbBox.width) + 12;
  const bottom = Math.max(taBox.y + taBox.height, lbBox.y + lbBox.height) + 12;

  await page.screenshot({
    path: resolve(OUT_DIR, 'feature-mentions.png'),
    clip: {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: right - x,
      height: bottom - y,
    },
  });
});
