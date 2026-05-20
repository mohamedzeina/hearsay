import { expect, test } from '@playwright/test';

test.describe('Browse flow', () => {
  test('home → topic → post', async ({ page }) => {
    await page.goto('/');
    // Seeded posts surface on the homepage.
    await expect(
      page.getByRole('link', { name: /my favorite pasta sauce/i })
    ).toBeVisible();

    // Navigate via a link whose href is exactly /topics/cooking (the topic chip).
    await page.locator('a[href="/topics/cooking"]').first().click();
    await expect(page).toHaveURL(/\/topics\/cooking$/);

    // Open the seeded post.
    await page
      .getByRole('link', { name: /my favorite pasta sauce/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/topics\/cooking\/posts\//);
    await expect(
      page.getByRole('heading', { name: /my favorite pasta sauce/i })
    ).toBeVisible();
  });

  test('signin modal opens when unauthenticated user clicks upvote', async ({
    page,
  }) => {
    await page.goto('/topics/cooking');
    // Click the first post to land on its show page.
    await page
      .getByRole('link', { name: /my favorite pasta sauce/i })
      .first()
      .click();

    // Find the upvote button. There may be several (post + comments) — first is the post.
    const upvote = page.getByRole('button', { name: /^upvote$/i }).first();
    await upvote.click();

    // Modal appears with the right CTA.
    await expect(page.getByText(/sign in to upvote/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /continue with github/i })
    ).toBeVisible();
  });
});
