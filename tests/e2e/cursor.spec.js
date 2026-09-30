import { test, expect, devices } from '@playwright/test';

test('cursor de tinta aparece com rastro e cresce sobre links', async ({ page }) => {
  await page.goto('/certificates');
  const dot = page.locator('[data-cursor="ink"]');
  await expect(dot).toHaveCount(1);
  await expect(page.locator('[data-cursor-trail]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Projetos' }).first().hover();
  await expect(dot).toHaveAttribute('data-hover', 'true');
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('mantém o ponto e tira o rastro', async ({ page }) => {
    await page.goto('/certificates');
    await expect(page.locator('[data-cursor="ink"]')).toHaveCount(1);
    await expect(page.locator('[data-cursor-trail]')).toHaveCount(0);
  });
});

// defaultBrowserType não pode ser usado dentro de describe
const { defaultBrowserType, ...pixel7 } = devices['Pixel 7'];

test.describe('em celular', () => {
  test.use(pixel7);

  test('não mostra o cursor customizado', async ({ page }) => {
    await page.goto('/certificates');
    await expect(page.locator('.responsive-title')).toBeVisible();
    await expect(page.locator('[data-cursor="ink"]')).toHaveCount(0);
  });
});
