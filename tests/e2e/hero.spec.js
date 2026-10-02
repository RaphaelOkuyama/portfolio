import { test, expect } from '@playwright/test';

const LATIN = 'Raphael Nobuyuki Haga Okuyama';
const KATAKANA = 'ラファエル ノブユキ ハガ オクヤマ';
const HIRAGANA = 'らふぁえる のぶゆき はが おくやま';

test('o h1 mostra o nome latino fixo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: LATIN })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.hero-name')).toHaveText(LATIN);
  await expect(page.locator('.hero-name-jp')).toHaveAttribute('aria-hidden', 'true');
});

test('o nome japonês cicla katakana → hiragana → katakana, e o latino não muda', async ({ page }) => {
  await page.goto('/');
  const jp = page.locator('.hero-name-jp');
  await expect(jp).toHaveText(HIRAGANA, { timeout: 15_000 });
  const box = await jp.boundingBox();
  expect(box.width).toBeLessThanOrEqual(page.viewportSize().width);
  await expect(page.locator('.hero-name')).toHaveText(LATIN);
  await expect(jp).toHaveText(KATAKANA, { timeout: 15_000 });
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('o nome japonês fica no katakana, sem ciclo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 6_000 });
    await page.waitForTimeout(7_000);
    await expect(page.locator('.hero-name-jp')).toHaveText(KATAKANA);
  });
});
