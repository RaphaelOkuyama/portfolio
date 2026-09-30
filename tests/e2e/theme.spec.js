import { test, expect } from '@playwright/test';

test('tema padrão é noite e o toggle alterna para dia, persistindo', async ({ page }) => {
  await page.goto('/certificates');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'night');

  await page.getByRole('button', { name: 'Alternar dia/noite' }).first().click();
  await expect(html).toHaveAttribute('data-theme', 'day');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'day');
});

test('valor antigo "light" no localStorage vira dia', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.goto('/certificates');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
});

test('o script inline aplica o tema salvo mesmo sem o React', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'day'));
  // Bloqueia os bundles: só o HTML do servidor e o script inline rodam
  await page.route('**/_next/static/chunks/**', (route) => route.abort());
  await page.goto('/certificates');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
});
