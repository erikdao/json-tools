import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

for (const route of ['/beautify', '/minify', '/validate', '/parse']) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
}
