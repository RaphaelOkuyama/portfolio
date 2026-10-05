import { test, expect, devices } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

const loader = (page) => page.locator('[data-loader="enso"]');

async function waitLoader(page) {
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
}

// Corpos dos chunks JS que a página baixou
function trackChunks(page) {
  const bodies = [];
  page.on('response', async (response) => {
    if (!/\/_next\/static\/chunks\/.*\.js$/.test(response.url())) return;
    try {
      bodies.push(await response.text());
    } catch {
      // Resposta descartada (navegação): não importa aqui
    }
  });
  return bodies;
}

test.describe('Performance: o que fica fora do carregamento', () => {
  test('avisos (sonner) e QR do meishi só baixam quando alguém usa', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const errors = collectConsoleErrors(page);
    const chunks = trackChunks(page);
    await page.goto('/');
    await waitLoader(page);
    await page.waitForTimeout(1500);
    const has = (needle) => chunks.some((body) => body.includes(needle));
    expect(has('data-sonner-toaster')).toBe(false);
    expect(has('QR Code version')).toBe(false);

    // Copiar o e-mail mostra o aviso: o sonner chega na hora
    const copy = page.getByRole('button', { name: 'Copiar e-mail' });
    await copy.scrollIntoViewIfNeeded();
    await copy.click();
    await expect(page.locator('[data-sonner-toast]')).toContainText('E-mail copiado!');

    // O meishi abre com o QR do vCard
    const open = page.locator('.meishi-open');
    await open.scrollIntoViewIfNeeded();
    await open.click();
    // O QR é um SVG estático gerado no build (app/meishi-qr), pedido só agora
    await expect(page.locator('img.meishi-qr')).toHaveAttribute('src', '/meishi-qr/pt');
    await expect.poll(() => page.locator('img.meishi-qr').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('a cena só aparece com os shaders compilados e entra num fade', async ({ page }) => {
    await page.goto('/');
    await waitLoader(page);
    await expect.poll(() => page.evaluate(() => performance.getEntriesByName('scene-ready').length), { timeout: 15_000 }).toBe(1);
    const wrapper = page.locator('[data-scene="webgl"] > div').first();
    await expect.poll(() => wrapper.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5_000 }).toBe(1);
  });
});

const { defaultBrowserType, ...pixel7 } = devices['Pixel 7'];

test.describe('Celular: textura washi', () => {
  test.use(pixel7);

  test('o papel do Stack fica dentro de cada painel, sem fibras esticadas pela tela', async ({ page }) => {
    await page.goto('/');
    await waitLoader(page);
    // .zen-panels vira display: contents: o ::after dele não pode existir (cobria a página inteira)
    const panels = page.locator('.zen-panels');
    await expect.poll(() => panels.evaluate((el) => getComputedStyle(el, '::after').content)).toBe('none');
    // Cada painel do acordeão leva o próprio papel
    const panel = page.locator('.zen-panel').first();
    await expect.poll(() => panel.evaluate((el) => getComputedStyle(el, '::after').backgroundImage)).toContain('svg');
  });
});
