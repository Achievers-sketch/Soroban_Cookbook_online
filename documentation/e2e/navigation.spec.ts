import { test, expect } from '@playwright/test';

const GITHUB_URL = 'https://github.com/Soroban-Cookbook/Soroban_Cookbook_online';

test.describe('desktop navigation', () => {
  test('home → Docs → pattern page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Soroban Cookbook/);

    await page.getByRole('link', { name: 'Docs' }).first().click();
    await expect(page).toHaveURL(/\/docs\//);

    await page.getByRole('link', { name: 'Patterns' }).first().click();
    const overviewLink = page.getByRole('link', { name: 'Overview' });
    if (await overviewLink.isVisible()) {
      await overviewLink.click();
    }
    await expect(page).toHaveURL(/\/docs\/patterns/);
  });

  test('GitHub navbar link points to correct repo', async ({ page }) => {
    await page.goto('/');

    const githubLink = page.locator('nav.navbar a.navbar__link[href*="github.com"]').first();
    await expect(githubLink).toHaveAttribute('href', GITHUB_URL);
  });
});

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('hamburger opens nav and Docs link is reachable', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('.navbar__toggle').first();
    await expect(toggle).toBeVisible();
    await toggle.click();

    // Drawer items can remain CSS-hidden during/after open; assert open state + href, then navigate
    await expect(page.locator('.navbar-sidebar--show')).toBeAttached({ timeout: 10_000 });
    const docsHref = await page
      .locator('.navbar-sidebar a.navbar__link')
      .filter({ hasText: /^Docs$/ })
      .first()
      .getAttribute('href');
    expect(docsHref).toBeTruthy();
    expect(docsHref!).toMatch(/\/docs/);

    await page.goto(docsHref!);
    await expect(page).toHaveURL(/\/docs\//);
  });

  test('mobile menu contains GitHub link', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('.navbar__toggle').first();
    await toggle.click();

    await expect(page.locator('.navbar-sidebar--show')).toBeAttached({ timeout: 10_000 });
    const githubLink = page.locator('.navbar-sidebar a[href*="github.com"]').first();
    await expect(githubLink).toHaveAttribute('href', GITHUB_URL);
  });
});
