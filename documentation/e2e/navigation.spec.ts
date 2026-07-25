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

    // Open drawer panel (items sit above the backdrop that otherwise intercepts clicks)
    const panel = page.locator('.navbar-sidebar--show .navbar-sidebar__items');
    await expect(panel).toBeVisible({ timeout: 10_000 });

    const docsLink = panel.getByRole('link', { name: 'Docs' }).first();
    await expect(docsLink).toBeVisible();
    // Force avoids intermittent backdrop interception in Docusaurus mobile nav
    await docsLink.click({ force: true });
    await expect(page).toHaveURL(/\/docs\//);
  });

  test('mobile menu contains GitHub link', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('.navbar__toggle').first();
    await toggle.click();

    const panel = page.locator('.navbar-sidebar--show .navbar-sidebar__items');
    await expect(panel).toBeVisible({ timeout: 10_000 });

    const githubLink = panel.locator('a[href*="github.com"]').first();
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', GITHUB_URL);
  });
});
