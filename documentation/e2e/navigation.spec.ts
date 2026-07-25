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
    const githubLink = page.locator('.navbar').getByRole('link', { name: /GitHub/i }).first();
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

    // Infima adds navbar-sidebar--show on the navbar when the drawer is open
    await expect(page.locator('.navbar-sidebar--show')).toBeAttached({ timeout: 10_000 });

    // Backdrop intercepts normal clicks; force-click the Docs item in the drawer
    const docsLink = page.locator('.navbar-sidebar a[href*="/docs"]').first();
    await expect(docsLink).toBeAttached();
    await docsLink.click({ force: true });
    await expect(page).toHaveURL(/\/docs\//);
  });

  test('mobile menu contains GitHub link', async ({ page }) => {
    await page.goto('/');

    const toggle = page.locator('.navbar__toggle').first();
    await toggle.click();
    await expect(page.locator('.navbar-sidebar--show')).toBeAttached({ timeout: 10_000 });

    const githubLink = page.locator(`.navbar-sidebar a[href="${GITHUB_URL}"]`).first();
    await expect(githubLink).toBeAttached();
  });
});