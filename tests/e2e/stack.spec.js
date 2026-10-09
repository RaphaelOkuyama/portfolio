import { test, expect, devices } from '@playwright/test';

async function openStack(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => document.getElementById('stack').scrollIntoView({ block: 'start' }));
}

const tabs = (page) => page.locator('#stack').getByRole('tab');
const panel = (page) => page.locator('#stack').getByRole('tabpanel');

test('o jardim tem 6 pedras e a primeira começa aberta', async ({ page }) => {
  await openStack(page);
  await expect(tabs(page)).toHaveCount(6);
  await expect(tabs(page).first()).toHaveAttribute('aria-selected', 'true');
  await expect(panel(page)).toHaveCount(1); // só o painel ativo fica visível
  await expect(panel(page)).toContainText('TypeScript');
  await expect(panel(page)).toContainText('04 ferramentas');
});

test('escolher uma pedra mostra as ferramentas daquela área', async ({ page }) => {
  await openStack(page);
  const backend = page.locator('#stack').getByRole('tab', { name: /Back-end/ });
  await backend.click();
  await expect(backend).toHaveAttribute('aria-selected', 'true');
  await expect(tabs(page).first()).toHaveAttribute('aria-selected', 'false');
  await expect(panel(page)).toContainText('NestJS');
  await expect(panel(page)).not.toContainText('TypeScript');
});

test('o card mostra só o nome de cada tecnologia, com o logo', async ({ page }) => {
  await openStack(page);
  await page.locator('#stack').getByRole('tab', { name: /Front-end/ }).click();
  const rows = panel(page).locator('.zen-tool');
  await expect(rows).toHaveCount(9);
  const three = rows.filter({ hasText: 'Three.js' }).first();
  await expect(three).toHaveText('Three.js');
  await expect(three.locator('svg')).toHaveCount(1); // logo
  await expect(panel(page).getByRole('link')).toHaveCount(0);
});

test('a caixa do painel anima a altura em vez de pular', async ({ page }) => {
  await openStack(page);
  const box = page.locator('#stack .zen-panels');
  const before = (await box.boundingBox()).height;
  // Grava cada altura que a animação escreve no style (rAF sozinho perde quadros com o WebGL
  // renderizado por software nos testes)
  await page.evaluate(() => {
    const el = document.querySelector('#stack .zen-panels');
    window.__heights = [];
    new MutationObserver(() => {
      const h = parseFloat(el.style.height);
      if (!Number.isNaN(h)) window.__heights.push(h);
    }).observe(el, { attributes: true, attributeFilter: ['style'] });
  });
  await page.locator('#stack').getByRole('tab', { name: /Testes/ }).click();
  await expect(box).not.toHaveAttribute('style', /height/, { timeout: 5_000 });
  const heights = await page.evaluate(() => window.__heights);
  const after = (await box.boundingBox()).height;
  expect(after).toBeGreaterThan(before);
  // Passou por alturas intermediárias (não pulou direto)
  expect(heights.some((h) => h > before + 2 && h < after - 2)).toBe(true);
});

test('as setas do teclado navegam entre as pedras', async ({ page }) => {
  await openStack(page);
  await tabs(page).first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs(page).nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs(page).nth(1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(tabs(page).last()).toHaveAttribute('aria-selected', 'true');
});

test('todas as ferramentas continuam no HTML para SEO', async ({ page }) => {
  await openStack(page);
  // Painéis inativos ficam com hidden, mas o texto existe no DOM
  const html = await page.locator('#stack').innerHTML();
  for (const tool of ['NestJS', 'Stripe (Checkout e Webhooks)', 'Playwright', 'Power BI', 'Three.js']) {
    expect(html).toContain(tool);
  }
});

test.describe('em celular', () => {
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  test.use(pixel);

  test('as pedras viram linhas da mesma largura', async ({ page }) => {
    await openStack(page);
    const first = await tabs(page).nth(0).boundingBox();
    const second = await tabs(page).nth(1).boundingBox();
    expect(Math.abs(first.x - second.x)).toBeLessThan(2);
    expect(Math.abs(first.width - second.width)).toBeLessThan(2);
    expect(second.y).toBeGreaterThan(first.y);
  });

  test('acordeão: o painel abre logo abaixo da pedra escolhida', async ({ page }) => {
    await openStack(page);
    const stone = page.locator('#stack').getByRole('tab', { name: /Dados/ });
    await stone.click();
    const stoneBox = await stone.boundingBox();
    const panelBox = await panel(page).boundingBox();
    const nextBox = await tabs(page).nth(4).boundingBox();
    expect(panelBox.y).toBeGreaterThan(stoneBox.y + stoneBox.height - 1);
    expect(panelBox.y - (stoneBox.y + stoneBox.height)).toBeLessThan(20);
    // A pedra seguinte vem depois do painel
    expect(nextBox.y).toBeGreaterThan(panelBox.y + panelBox.height - 1);
  });
});
