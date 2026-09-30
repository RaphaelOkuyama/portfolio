import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

test('cena WebGL monta um canvas oculto para leitores de tela', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/');
  const scene = page.locator('[data-scene="webgl"]');
  await expect(scene).toHaveAttribute('aria-hidden', 'true');
  await expect(scene.locator('canvas')).toHaveCount(1, { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('o canvas persiste entre rotas (não remonta)', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('[data-scene="webgl"] canvas');
  await expect(canvas).toHaveCount(1, { timeout: 15_000 });
  await canvas.evaluate((el) => { el.dataset.marker = 'same'; });
  await page.getByRole('link', { name: 'Certificados' }).first().click();
  await expect(page).toHaveURL(/\/certificates$/);
  await expect(page.locator('[data-scene="webgl"] canvas[data-marker="same"]')).toHaveCount(1);
});

test.describe('sem WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
        if (/webgl/i.test(type)) return null;
        return original.call(this, type, ...args);
      };
    });
  });

  test('mostra o fundo estático e o conteúdo continua acessível', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-scene="fallback"] svg')).toHaveCount(1);
    await expect(page.locator('[data-scene] canvas')).toHaveCount(0);
    await expect(page.locator('.hero-title')).toBeVisible({ timeout: 15_000 });
  });
});
