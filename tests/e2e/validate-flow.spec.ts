import { test, expect } from '@playwright/test';
import { setEditorValue } from './helpers';

test('validate reports stats on valid JSON', async ({ page }) => {
  await page.goto('/validate');
  await setEditorValue(page, '{"a":{"b":1}}');
  await page.getByRole('button', { name: /run validate/i }).click();
  await expect(page.getByRole('status')).toContainText(/valid · 2 keys · depth 2/);
});

test('validate shows error with jump on bad JSON', async ({ page }) => {
  await page.goto('/validate');
  await setEditorValue(page, '{a:1}');
  await page.getByRole('button', { name: /run validate/i }).click();
  await expect(page.getByRole('status')).toContainText(/validate failed at \d+:\d+/);
  await expect(page.getByRole('button', { name: /\[ jump \]/i })).toBeVisible();
});
