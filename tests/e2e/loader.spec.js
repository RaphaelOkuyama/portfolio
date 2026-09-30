import { test, expect } from '@playwright/test';

const loader = (page) => page.locator('[data-loader="enso"]');

test('o ensō aparece na carga e some revelando o hero', async ({ page }) => {
  await page.goto('/');
  await expect(loader(page)).toBeVisible();
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.hero-title')).toBeVisible();
});

test('navegação no cliente não mostra o loader de novo', async ({ page }) => {
  await page.goto('/');
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
  await page.getByRole('link', { name: 'Certificados' }).first().click();
  await expect(page).toHaveURL(/\/certificates$/);
  await expect(loader(page)).toHaveCount(0);
});

test('sem WebGL o loader também termina', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      if (/webgl/i.test(type)) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('o loader some sem a espera mínima', async ({ page }) => {
    await page.goto('/');
    await expect(loader(page)).toHaveCount(0, { timeout: 6_000 });
  });
});
