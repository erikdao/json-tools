import { expect, test } from '@playwright/test';

test('?indent=tab applies on direct load', async ({ page }) => {
  await page.goto('/beautify?indent=tab&sort=1');
  await expect(page.getByRole('button', { name: 'tab' })).toHaveAttribute('aria-pressed', 'true');
});

test('tab clicks navigate between tools', async ({ page }) => {
  await page.goto('/beautify');
  await page.getByRole('link', { name: /^minify$/ }).click();
  await expect(page).toHaveURL(/\/minify$/);
});
