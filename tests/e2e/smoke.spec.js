import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

test('home carrega com o nome no hero', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/');
  await expect(page.locator('.hero-title')).toContainText('Raphael Nobuyuki Haga Okuyama', { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('detalhe do projeto IMACARDIOS carrega', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/projects/imacardios');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('IMACARDIOS');
  expect(errors).toEqual([]);
});

test('certificados carregam', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/certificates');
  await expect(page.locator('.responsive-title')).toBeVisible();
  expect(errors).toEqual([]);
});

test('rota inexistente mostra o 404', async ({ page }) => {
  // O próprio documento responde 404; o navegador loga isso como erro de recurso
  const errors = collectConsoleErrors(page, { ignore: [/status of 404/] });
  await page.goto('/rota-que-nao-existe');
  await expect(page.getByText('Página não encontrada')).toBeVisible();
  expect(errors).toEqual([]);
});
