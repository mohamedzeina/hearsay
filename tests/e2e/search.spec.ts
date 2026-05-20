import { expect, test } from '@playwright/test';

test.describe('Search suggestions', () => {
  test('shows topic and post matches as the user types', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill('cooking');

    // Topic suggestion appears.
    await expect(page.getByText('cooking').first()).toBeVisible();
  });

  test('clicking a topic suggestion lands on the topic page', async ({
    page,
  }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill('cooking');

    const topicLink = page
      .getByRole('link')
      .filter({ hasText: /cooking/i })
      .first();
    await topicLink.click();

    await expect(page).toHaveURL(/\/topics\/cooking/);
  });

  test('hides dropdown for very short queries', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill('a');

    // No suggestion menu items for sub-2-char queries.
    await expect(page.getByRole('option')).toHaveCount(0);
  });
});
