import { test, expect } from '@playwright/test';

/**
 * Cross-browser smoke tests for the Soroban Cookbook.
 *
 * These tests verify that critical pages load and render core content across
 * Chromium, Firefox, and WebKit. They run against the built static site
 * (`bun run build && bun run serve`).
 */

test.describe('Homepage', () => {
  test('loads and renders the site title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Soroban Cookbook/i);
  });

  test('navbar is visible', async ({ page }) => {
    await page.goto('/');
    const navbar = page.getByRole('navigation');
    await expect(navbar).toBeVisible();
  });

  test('Docs nav link is present', async ({ page }) => {
    await page.goto('/');
    const docsLink = page.getByRole('link', { name: /docs/i }).first();
    await expect(docsLink).toBeVisible();
  });
});

test.describe('Docs – Getting Started', () => {
  test('setup page loads', async ({ page }) => {
    await page.goto('/docs/getting-started/setup');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page).toHaveTitle(/setup/i);
  });

  test('first contract page loads', async ({ page }) => {
    await page.goto('/docs/getting-started/first-contract');
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Docs – Core Concepts', () => {
  test('introduction page loads', async ({ page }) => {
    await page.goto('/docs/concepts/introduction');
    await expect(page.getByRole('main')).toBeVisible();
  });
});

test.describe('Redirects', () => {
  test('/docs/intro redirects to /docs/concepts/introduction', async ({ page }) => {
    await page.goto('/docs/intro');
    await expect(page).toHaveURL(/\/docs\/concepts\/introduction/);
  });

  test('/docs/setup redirects to /docs/getting-started/setup', async ({ page }) => {
    await page.goto('/docs/setup');
    await expect(page).toHaveURL(/\/docs\/getting-started\/setup/);
  });
});

test.describe('Accessibility – basic', () => {
  test('homepage has exactly one <h1>', async ({ page }) => {
    await page.goto('/');
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
  });

  test('all images on homepage have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Snapshot alts in one evaluate to avoid flaky nth() on lazy/detached imgs
    const images = await page.locator('img').evaluateAll((imgs) =>
      imgs.map((img) => ({
        src: img.getAttribute('src') ?? '',
        alt: img.getAttribute('alt'),
      })),
    );
    expect(images.length).toBeGreaterThan(0);
    for (const { src, alt } of images) {
      expect(alt, `Image ${src || '(no src)'} is missing alt text`).not.toBeNull();
    }

    // Single evaluate avoids flaky per-image locator timeouts on lazy/detached nodes.
    const missingAlts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter((img) => !img.hasAttribute('alt'))
        .map((img) => img.getAttribute('src') || img.outerHTML.slice(0, 120)),
    );

    expect(missingAlts, `Images missing alt: ${missingAlts.join(', ')}`).toEqual([]);
  });
});