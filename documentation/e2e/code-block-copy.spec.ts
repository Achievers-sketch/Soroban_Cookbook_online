import { expect, test } from '@playwright/test';

test('copy button copies the visible code block content', async ({ page }) => {
  await page.goto('/docs/getting-started/setup');

  const codeBlock = page.locator('pre').filter({ has: page.locator('code') }).first();
  await expect(codeBlock).toBeVisible();

  const expectedText = (await codeBlock.innerText()).trim();

  // Stub clipboard so Chromium/Firefox/WebKit all behave the same
  await page.evaluate(() => {
    const w = window as unknown as { __copiedText?: string };
    w.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          w.__copiedText = text;
        },
        readText: async () => w.__copiedText ?? '',
      },
    });
  });

  const copyButton = page.getByRole('button', { name: /copy code/i }).first();
  await expect(copyButton).toBeVisible();
  await copyButton.click();

  await expect
    .poll(async () => page.evaluate(() => (window as unknown as { __copiedText?: string }).__copiedText ?? ''))
    .toBe(expectedText);
});