import { test, expect } from '@playwright/test';

const LATIN = 'Raphael Nobuyuki Haga Okuyama';

test('o h1 acessível mantém o nome latino', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: LATIN })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.hero-name')).toHaveAttribute('aria-hidden', 'true');
});

test('o nome visível cicla por katakana e kanji', async ({ page }) => {
  await page.goto('/');
  const name = page.locator('.hero-name');
  await expect(name).toHaveText('ラファエル ノブユキ ハガ オクヤマ', { timeout: 15_000 });
  await expect(name).toHaveText('ラファエル 信幸 芳賀 奥山', { timeout: 15_000 });
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('o nome fica no latino, sem ciclo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 6_000 });
    await page.waitForTimeout(7_000);
    await expect(page.locator('.hero-name')).toHaveText(LATIN);
  });
});
