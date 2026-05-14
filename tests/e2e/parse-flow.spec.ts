import { expect, test } from '@playwright/test';
import { setEditorValue } from './helpers';

test('parse renders tree with email key visible', async ({ page }) => {
  await page.goto('/parse');
  await setEditorValue(page, '{"users":[{"email":"x"}]}');
  await page.getByRole('button', { name: /run parse/i }).click();
  await expect(page.getByText('email')).toBeVisible();
});
