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
  // FeedNavMobile uses the same aria-label but is `lg:hidden` at 1440px.
  // Pin to the sidebar variant via the page's only <aside> ancestor.
  // `.first()` guards against transient duplicate DOM nodes Turbopack
  // can leave behind during Fast Refresh between serial test cases.
  const feedNav = page.locator('aside nav[aria-label="Feed scope"]').first();
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

test('feature-post-detail + feature-threading — two framed shots from the same page', async ({
  page,
}) => {
  await signIn(page);
  await setTheme(page, 'light');
  await page.goto('/');

  // Navigate to a specifically heavy-comment post so both shots have
  // meaningful content. "What's one habit..." is the engineer-habits
  // post the seed creates with the deepest thread (Riley → Jordan,
  // Aiden → Lin → Maya). Clicking by title (vs. "first card") guards
  // against the home feed's Top sort landing on a low-reply post when
  // upvote ties break differently between seed runs.
  await page.getByRole('link', { name: /one habit/i }).first().click();
  // Wait for the post show + at least one comment to hydrate.
  await expect(page.locator('article').first()).toBeVisible();
  await expect(page.locator('[id^="c-"]').first()).toBeVisible();
  await hideDevChrome(page);

  // ---- Shot 1: post body + sidebar (above the fold) ----
  // 1300px tall fits the breadcrumb + post card + reply form + sidebar
  // panels (Author + Thread map) without bleeding into comments. Keeps
  // the README tile readable instead of an oddly long vertical strip.
  await page.setViewportSize({ width: 1440, height: 1300 });
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: resolve(OUT_DIR, 'feature-post-detail.png'),
    fullPage: false,
  });

  // ---- Shot 2: threaded comments (scrolled past the post body) ----
  // Scroll so the "X replies" heading sits near the top of the
  // viewport, then capture 1700px of comment content underneath.
  // That window reliably contains multiple parent → child threads in
  // the seed (Riley → Jordan, Nadia → Sasha, Aiden → Lin → Maya).
  await page.setViewportSize({ width: 1440, height: 1700 });
  await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll('h2')).find((el) =>
      /\breplies?\b/i.test(el.textContent ?? '')
    );
    if (heading) {
      heading.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
      // A little headroom above the heading so the sort pills don't
      // hug the very top edge of the frame.
      window.scrollBy({ top: -32, behavior: 'instant' as ScrollBehavior });
    } else {
      window.scrollTo({ top: 1100, behavior: 'instant' as ScrollBehavior });
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: resolve(OUT_DIR, 'feature-threading.png'),
    fullPage: false,
  });

  // Restore for any subsequent test in this file.
  await page.setViewportSize({ width: 1440, height: 900 });
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
  // Pin the textarea ~120px below the top of the viewport so there's
  // room below for the portaled `position: absolute` suggestions
  // dropdown. `behavior: 'instant'` is critical — globals.css sets
  // `html { scroll-behavior: smooth }`, so the default behaviour
  // would animate the scroll asynchronously and the next bounding-box
  // read would still report the pre-scroll position.
  await textarea.evaluate((el) => {
    el.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
  });
  await page.evaluate(() => window.scrollBy({ top: -120, behavior: 'instant' as ScrollBehavior }));
  // Tiny extra settle so the dropdown's scroll/resize listener can
  // re-anchor against the new textarea coordinates.
  await page.waitForTimeout(100);
  await textarea.click();
  await textarea.fill('');
  // Single character after @ triggers the prefix-matched suggestion list.
  await textarea.type('hey @m');
  // Wait for the portaled dropdown.
  const listbox = page.locator('[role="listbox"]');
  await expect(listbox).toBeVisible({ timeout: 5000 });
  // Wait for at least one suggestion row to land — the listbox is
  // measurable the instant it mounts, but options stream in via fetch
  // and bounding-box height stays at the empty-list value until they
  // hydrate. Without this wait the clip was framing only the textarea.
  await expect(listbox.locator('[role="option"]').first()).toBeVisible();
  await page.waitForTimeout(200);

  // Frame the textarea + dropdown by computing from real bounding
  // boxes. Now reliable because the smooth-scroll guard above lets
  // the dropdown re-anchor before we measure.
  const taBox = await textarea.boundingBox();
  const lbBox = await listbox.boundingBox();
  if (!taBox || !lbBox) throw new Error('bounding boxes missing');
  const x = Math.max(0, taBox.x - 12);
  const y = Math.max(0, taBox.y - 12);
  const right = Math.max(taBox.x + taBox.width, lbBox.x + lbBox.width) + 12;
  const bottom = lbBox.y + lbBox.height + 12;
  await page.screenshot({
    path: resolve(OUT_DIR, 'feature-mentions.png'),
    clip: { x, y, width: right - x, height: bottom - y },
  });
});
