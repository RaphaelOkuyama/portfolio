import { test, expect, devices } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

const loader = (page) => page.locator('[data-loader="enso"]');

async function waitLoader(page) {
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
}

// Intercepta os chunks JS e deixa `onBody` decidir o que fazer com cada um
async function inspectChunks(page, onBody) {
  await page.route('**/_next/static/chunks/**/*.js', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    if (onBody(body) === 'abort') return route.abort();
    return route.fulfill({ response, body });
  });
}

test.describe('Certificados (証)', () => {
  test('cada certificado recebe um carimbo hanko', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/certificates');
    await waitLoader(page);
    const cards = page.locator('.cert-card');
    await expect(cards).toHaveCount(22);
    await expect(page.locator('.cert-hanko')).toHaveCount(22);
    const firstStamp = page.locator('.cert-hanko').first();
    await expect.poll(() => firstStamp.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5_000 }).toBeGreaterThan(0.95);
    expect(errors).toEqual([]);
  });

  test('os cartões de baixo carimbam ao rolar', async ({ page }) => {
    await page.goto('/certificates');
    await waitLoader(page);
    const last = page.locator('.cert-card').last();
    await expect.poll(() => last.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(0);
    await last.scrollIntoViewIfNeeded();
    await expect.poll(() => last.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5_000 }).toBeGreaterThan(0.95);
    await expect
      .poll(() => last.locator('.cert-hanko').evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5_000 })
      .toBeGreaterThan(0.95);
  });

  test('os links dos certificados abrem em nova aba', async ({ page }) => {
    await page.goto('/certificates');
    const link = page.getByRole('link', { name: /Ver Certificado/ }).first();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test.describe('com prefers-reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('todos os carimbos já aparecem, sem animação', async ({ page }) => {
      await page.goto('/certificates');
      await waitLoader(page);
      const last = page.locator('.cert-hanko').last();
      expect(await last.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    });
  });
});

test.describe('404 (迷子)', () => {
  test('rota inexistente fecha a névoa e oferece a volta', async ({ page }) => {
    await page.goto('/caminho-perdido');
    await waitLoader(page);
    await expect(page.locator('html')).toHaveAttribute('data-lost', 'true');
    await expect(page.locator('.nf-kanji')).toHaveText('迷子');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada');

    // Link simples (sem botão aninhado) que leva de volta à home e desfaz a névoa
    const back = page.getByRole('link', { name: 'Voltar para a base' });
    await expect(back.locator('button')).toHaveCount(0);
    await back.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).not.toHaveAttribute('data-lost', 'true');
  });
});

test.describe('Loader e scroll', () => {
  test('a página não rola enquanto o ensō está na tela', async ({ page }) => {
    await page.goto('/');
    await expect(loader(page)).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/is-loading/);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await waitLoader(page);
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
    await page.mouse.wheel(0, 800);
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBeGreaterThan(100);
  });
});

test.describe('Robustez da cena', () => {
  test('se o chunk 3D falhar, o fundo estático assume e o site segue', async ({ page }) => {
    await inspectChunks(page, (body) => (body.includes('WebGLRenderer') ? 'abort' : 'continue'));
    await page.goto('/');
    await expect(page.locator('[data-scene="fallback"] svg')).toHaveCount(1, { timeout: 15_000 });
    await waitLoader(page);
    await expect(page.locator('.hero-title')).toBeVisible();
  });

  test.describe('em celular (qualidade leve)', () => {
    const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
    test.use(pixel);

    test('o pós-processamento (bloom) nem é baixado', async ({ page }) => {
      let loadedBloom = false;
      await inspectChunks(page, (body) => {
        if (body.includes('BloomEffect')) loadedBloom = true;
        return 'continue';
      });
      await page.goto('/');
      await waitLoader(page);
      await expect(page.locator('[data-scene="webgl"] canvas')).toHaveCount(1, { timeout: 15_000 });
      await page.waitForTimeout(1500);
      expect(loadedBloom).toBe(false);
    });
  });

  test('a foto do Sobre é servida otimizada pelo next/image', async ({ page }) => {
    await page.goto('/');
    await waitLoader(page);
    const img = page.locator('.kakejiku-photo img');
    await expect(img).toHaveAttribute('src', /\/_next\/image\?url=%2Fprofile\.jpg/);
    await expect(img).toHaveAttribute('alt', 'Raphael Okuyama');
  });
});
