import { expect, test } from '@playwright/test';

test('copy button copies the visible code block content', async ({ page, browserName }) => {
  // Firefox/WebKit do not support the clipboard-read permission token.
  if (browserName === 'chromium') {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  }

  await page.goto('/docs/getting-started/setup');

  const codeBlock = page.locator('pre').filter({ has: page.locator('code') }).first();
  await expect(codeBlock).toBeVisible();

  const expectedText = (await codeBlock.innerText()).trim();
  const copyButton = page.getByRole('button', { name: /copy code/i }).first();

  await expect(copyButton).toBeVisible();
  await copyButton.click();

  // Visible label often stays "Copy"; assert clipboard on Chromium.
  // Other engines: smoke that the control remains usable after click.
  if (browserName === 'chromium') {
    await expect
      .poll(async () => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expectedText);
  } else {
    await expect(copyButton).toBeEnabled();
  }
});
