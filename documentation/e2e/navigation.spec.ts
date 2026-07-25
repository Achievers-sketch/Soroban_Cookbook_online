import { test, expect, type Page } from '@playwright/test';

const GITHUB_URL = 'https://github.com/Soroban-Cookbook/Soroban_Cookbook_online';

test.describe('desktop navigation', () => {
  test('home → Docs → pattern page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Soroban Cookbook/);

    // Navbar "Docs" link leads to the docs section
    await page.getByRole('link', { name: 'Docs' }).first().click();
    await expect(page).toHaveURL(/\/docs\//);

    // Navigate to a pattern page via the sidebar
    await page.getByRole('link', { name: 'Patterns' }).first().click();
    // Expand if collapsed (Docusaurus category may be a button)
    const overviewLink = page.getByRole('link', { name: 'Overview' });
    if (await overviewLink.isVisible()) {
      await overviewLink.click();
    }
    await expect(page).toHaveURL(/\/docs\/patterns/);
  });

  test('GitHub navbar link points to correct repo', async ({ page }) => {
    await page.goto('/');

    // Scope to the primary navbar — homepage also has community + footer GitHub links.
    const githubLink = page.locator('.navbar').getByRole('link', { name: /GitHub/i }).first();
    await expect(githubLink).toHaveAttribute('href', GITHUB_URL);
  });
});

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  async function openMobileNav(page: Page) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const toggle = page.locator('button.navbar__toggle');
    await expect(toggle).toBeVisible();

    // Ensure client JS hydrated before toggling.
    await page.waitForFunction(() => {
      const btn = document.querySelector('button.navbar__toggle');
      return !!btn && getComputedStyle(btn).display !== 'none';
    });

    await toggle.click();

    const openSidebar = page.locator('.navbar-sidebar--show');
    // Retry once if the first click raced hydration.
    if (!(await openSidebar.isVisible().catch(() => false))) {
      await toggle.click();
    }
    await expect(openSidebar).toBeVisible({ timeout: 15000 });
    return openSidebar;
  }

  test('hamburger opens nav and Docs link is reachable', async ({ page }) => {
    const sidebar = await openMobileNav(page);
    const docsLink = sidebar.locator('.navbar-sidebar__items').getByRole('link', { name: 'Docs' }).first();
    await expect(docsLink).toBeVisible();
    await docsLink.click();
    await expect(page).toHaveURL(/\/docs\//);
  });

  test('mobile menu contains GitHub link', async ({ page }) => {
    const sidebar = await openMobileNav(page);
    const githubLink = sidebar.locator('.navbar-sidebar__items').getByRole('link', { name: /GitHub/i });
    await expect(githubLink.first()).toBeVisible();
    await expect(githubLink.first()).toHaveAttribute('href', GITHUB_URL);
  });
});
