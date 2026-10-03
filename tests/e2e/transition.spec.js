import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

const overlay = (page) => page.locator('[data-page-transition]');

// Registra, dentro da página, cada estado do noren e a rota naquele instante: estados rápidos
// não escapam mesmo quando o click() do Playwright só volta depois da navegação começar.
// No início do 'reveal' (a rota já trocou por baixo) guarda onde estavam as duas faixas
async function recordNorenStates(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-page-transition]');
    window.__norenStates = [];
    new MutationObserver(() => {
      const state = el.getAttribute('data-state');
      const panels = state === 'reveal'
        ? [...el.querySelectorAll('.noren-panel')].map((p) => {
          const r = p.getBoundingClientRect();
          return { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom) };
        })
        : undefined;
      window.__norenStates.push({ state, path: location.pathname, panels });
    }).observe(el, { attributes: true, attributeFilter: ['data-state'] });
  });
}

const norenStates = (page) => page.evaluate(() => window.__norenStates);

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

test('navegar pela navbar desce o noren, troca a página por baixo e abre as faixas', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await recordNorenStates(page);
  await page.getByRole('link', { name: 'Certificados' }).first().click();
  // A rota troca por baixo do noren e as faixas se abrem
  await expect(page).toHaveURL(/\/certificates$/);
  await expect(overlay(page)).toHaveAttribute('data-state', 'idle', { timeout: 5_000 });
  await expect(page.locator('.cert-item').first()).toBeVisible();
  // Primeiro o noren cobriu ainda na página atual, só depois a rota trocou
  const states = await norenStates(page);
  expect(states[0]).toMatchObject({ state: 'cover', path: '/' });
  const reveal = states.find((s) => s.state === 'reveal');
  expect(reveal.path).toBe('/certificates');
  // Na troca, as duas faixas juntas cobriam a tela inteira (metade cada, do topo ao pé)
  const { width, height } = page.viewportSize();
  const [left, right] = reveal.panels;
  expect(left).toMatchObject({ top: 0, left: 0 });
  expect(right.right).toBe(width);
  expect(Math.abs(left.right - right.left)).toBeLessThanOrEqual(1);
  expect(Math.min(left.bottom, right.bottom)).toBeGreaterThanOrEqual(height);
  // Ao terminar, as faixas saíram para os lados
  const after = await page.locator('.noren-panel').evaluateAll((els) => els.map((p) => p.getBoundingClientRect()));
  expect(after[0].right).toBeLessThanOrEqual(0);
  expect(after[1].left).toBeGreaterThanOrEqual(width);
  expect(errors).toEqual([]);
});

test('o noren tem o kamon 奥山 dividido entre as duas faixas', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('.noren-panel')).toHaveCount(2);
  await expect(page.locator('.noren-panel [data-kamon]')).toHaveCount(2);
});

test('voltar para a home também usa o noren, e o conteúdo fica clicável depois', async ({ page }) => {
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

test('âncora na mesma página não aciona o noren', async ({ page }) => {
  await openHome(page);
  await page.getByRole('link', { name: 'Contato' }).first().click();
  await expect(page).toHaveURL(/\/#contato$/);
  await expect(overlay(page)).toHaveAttribute('data-state', 'idle');
});

test('painéis do emakimono usam a própria transição, sem o noren', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => {
    const s = document.getElementById('projects');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 40);
  });
  await page.waitForTimeout(800);
  await page.locator('.emaki-panel').first().click();
  await expect(page.locator('.emaki-morph')).toHaveCount(1);
  await expect(overlay(page)).toHaveAttribute('data-state', 'idle');
  await expect(page).toHaveURL(/\/projects\/imacardios$/);
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('a navegação acontece direto, sem noren', async ({ page }) => {
    await openHome(page);
    await page.getByRole('link', { name: 'Certificados' }).first().click();
    await expect(page).toHaveURL(/\/certificates$/);
    await expect(overlay(page)).toHaveAttribute('data-state', 'idle');
  });
});
