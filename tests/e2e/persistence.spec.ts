import { test, expect } from '@playwright/test';
import { setEditorValue } from './helpers';

test('input survives a reload', async ({ page }) => {
  await page.goto('/beautify');
  await setEditorValue(page, '{"persisted":true}');
  // debounce write is 150ms
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator('.cm-content').first()).toContainText('"persisted"');
});

test('clear empties the editor', async ({ page }) => {
  await page.goto('/beautify');
  await setEditorValue(page, '{"x":1}');
  await page.getByRole('button', { name: /clear input/i }).click();
  await expect(page.locator('.cm-content').first()).not.toContainText('"x"');
});
