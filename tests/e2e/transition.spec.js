import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

const overlay = (page) => page.locator('[data-ink-transition]');

// Registra, dentro da página, cada estado da tinta e a rota naquele instante: estados rápidos
// não escapam mesmo quando o click() do Playwright só volta depois da navegação começar
async function recordInkStates(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-ink-transition]');
    window.__inkStates = [];
    new MutationObserver(() => {
      window.__inkStates.push({ state: el.getAttribute('data-state'), path: location.pathname });
    }).observe(el, { attributes: true, attributeFilter: ['data-state'] });
  });
}

const inkStates = (page) => page.evaluate(() => window.__inkStates);

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

test('navegar pela navbar cobre a tela com tinta e descobre na nova página', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await recordInkStates(page);
  await page.getByRole('link', { name: 'Certificados' }).first().click();
  // A rota troca por baixo da tinta e ela recua
  await expect(page).toHaveURL(/\/certificates$/);
  await expect(overlay(page)).toHaveAttribute('data-state', 'idle', { timeout: 5_000 });
  await expect(page.locator('.cert-card').first()).toBeVisible();
  // Primeiro a tinta cobriu ainda na página atual, só depois a rota trocou
  const states = await inkStates(page);
  expect(states[0]).toEqual({ state: 'cover', path: '/' });
  expect(states.map((s) => s.state)).toContain('reveal');
  expect(errors).toEqual([]);
});

test('voltar para a home também usa a tinta, e o conteúdo fica clicável depois', async ({ page }) => {
  await page.goto('/certificates');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
  await page.getByRole('link', { name: 'Home' }).first().click();
  await expect(overlay(page)).toHaveAttribute('data-state', 'cover');
  await expect(page).toHaveURL(/\/$/);
  await expect(overlay(page)).toHaveAttribute('data-state', 'idle', { timeout: 5_000 });
  await expect(overlay(page)).toHaveCSS('pointer-events', 'none');
  await page.getByRole('link', { name: 'Projetos' }).first().click();
  await expect(page).toHaveURL(/\/projects$/);
});

test('âncora na mesma página não aciona a tinta', async ({ page }) => {
  await openHome(page);
  await page.getByRole('link', { name: 'Contato' }).first().click();
  await expect(page).toHaveURL(/\/#contato$/);
  await expect(overlay(page)).toHaveAttribute('data-state', 'idle');
});

test('painéis do emakimono mantêm a própria expansão, sem a tinta', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => {
    const s = document.getElementById('projects');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 40);
  });
  await page.waitForTimeout(800);
  await page.locator('.emaki-panel').first().click();
  await expect(page.locator('.emaki-expand')).toHaveCount(1);
  await expect(overlay(page)).toHaveAttribute('data-state', 'idle');
  await expect(page).toHaveURL(/\/projects\/imacardios$/);
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('a navegação acontece direto, sem tinta', async ({ page }) => {
    await openHome(page);
    await page.getByRole('link', { name: 'Certificados' }).first().click();
    await expect(page).toHaveURL(/\/certificates$/);
    await expect(overlay(page)).toHaveAttribute('data-state', 'idle');
  });
});
