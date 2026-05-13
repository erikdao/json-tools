import { test, expect } from '@playwright/test';
import { setEditorValue } from './helpers';

test('beautify formats minified input', async ({ page }) => {
  await page.goto('/beautify');
  await setEditorValue(page, '{"a":1,"b":[1,2]}');
  await page.getByRole('button', { name: /run beautify/i }).click();
  await expect(page.locator('.cm-content').nth(1)).toContainText('"a": 1');
});

test('sort keys reorders', async ({ page }) => {
  await page.goto('/beautify');
  await setEditorValue(page, '{"b":1,"a":2}');
  await page.getByRole('checkbox', { name: /sort keys/i }).check();
  await page.getByRole('button', { name: /run beautify/i }).click();
  // Wait for the output to render, then read via textContent (which works on
  // CodeMirror's contenteditable readonly content; innerText can be empty).
  const output = page.locator('.cm-content').nth(1);
  await expect(output).toContainText('"a": 2');
  const out = (await output.textContent()) ?? '';
  expect(out.indexOf('"a"')).toBeGreaterThan(-1);
  expect(out.indexOf('"a"')).toBeLessThan(out.indexOf('"b"'));
});
