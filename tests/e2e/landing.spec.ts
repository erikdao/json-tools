import { expect, test } from '@playwright/test';

test('/ redirects to /beautify and shows the editor', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/beautify$/);
  await expect(page.getByRole('link', { name: /^beautify$/ })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('button', { name: /run beautify/i })).toBeVisible();
});
