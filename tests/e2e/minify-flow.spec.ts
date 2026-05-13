import { test, expect } from '@playwright/test';
import { setEditorValue } from './helpers';

test('minify strips whitespace', async ({ page }) => {
  await page.goto('/minify');
  await setEditorValue(page, '{\n  "a": 1\n}');
  await page.getByRole('button', { name: /run minify/i }).click();
  await expect(page.locator('.cm-content').nth(1)).toContainText('{"a":1}');
});
