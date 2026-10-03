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
  test('agrupados por área, com trilhas e um carimbo por área', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/certificates');
    await waitLoader(page);
    const board = page.locator('.cert-board > [data-lang="pt"]');
    await expect(board.locator('.cert-group')).toHaveCount(4);
    await expect(board.locator('.cert-group-title')).toContainText(['Bootcamps & Formações', 'Front-end', 'Back-end & Dados', 'Fundamentos']);
    await expect(page.locator('.cert-summary')).toContainText('22 certificados · 2 bootcamps · 1 formação');
    // JavaScript I a VI viram uma trilha com seis links
    const trilha = board.locator('.cert-item', { hasText: 'Trilha JavaScript' });
    await expect(trilha.locator('.cert-modules a')).toHaveText(['I', 'II', 'III', 'IV', 'V', 'VI']);
    // Nenhum "Concluído" repetido e um carimbo por área
    await expect(board).not.toContainText('Concluído');
    await expect(board.locator('.cert-hanko')).toHaveCount(4);
    await expect.poll(() => board.locator('.cert-hanko').first().evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5_000 }).toBeGreaterThan(0.95);
    expect(errors).toEqual([]);
  });

  test('o filtro mostra só a área escolhida', async ({ page }) => {
    await page.goto('/certificates');
    await waitLoader(page);
    const filter = page.getByRole('button', { name: /Back-end & Dados/ });
    await filter.click();
    await expect(filter).toHaveAttribute('aria-pressed', 'true');
    const visible = page.locator('.cert-board > [data-lang="pt"] .cert-group:visible');
    await expect(visible).toHaveCount(1);
    await expect(visible).toContainText('SQL no NodeJS e Prisma ORM');
    await page.getByRole('button', { name: /^Todos/ }).click();
    await expect(page.locator('.cert-board > [data-lang="pt"] .cert-group:visible')).toHaveCount(4);
  });

  test('os 22 links continuam lá e abrem em nova aba', async ({ page }) => {
    await page.goto('/certificates');
    const links = page.locator('.cert-board > [data-lang="pt"] a[href*="drive.google.com"]');
    await expect(links).toHaveCount(22);
    await expect(links.first()).toHaveAttribute('target', '_blank');
    await expect(links.first()).toHaveAttribute('rel', /noopener/);
    await expect(page.getByRole('link', { name: 'Ver certificado: Curso de React' })).toBeAttached();
  });

  test('o HTML já sai pronto do servidor nos dois idiomas', async ({ request }) => {
    const html = await (await request.get('/certificates')).text();
    expect(html).toContain('Trilha JavaScript');
    expect(html).toContain('JavaScript Track');
  });

  test.describe('com prefers-reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('os carimbos já aparecem, sem animação', async ({ page }) => {
      await page.goto('/certificates');
      await waitLoader(page);
      const last = page.locator('.cert-board > [data-lang="pt"] .cert-hanko').last();
      expect(await last.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    });
  });
});

test.describe('404 (金継ぎ)', () => {
  test('rota inexistente fecha a névoa, conserta a tigela com ouro e oferece a volta', async ({ page }) => {
    await page.goto('/caminho-perdido');
    await waitLoader(page);
    await expect(page.locator('html')).toHaveAttribute('data-lost', 'true');
    await expect(page.locator('.nf-kanji')).toHaveText('金継ぎ');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada');
    await expect(page.locator('.nf-desc')).toContainText('consertado com ouro');

    // Três cacos e duas rachaduras de ouro que terminam inteiras (o DrawSVG desenha pelo
    // dasharray: o primeiro valor é o trecho visível do caminho)
    const bowl = page.locator('[data-kintsugi]');
    await expect(bowl.locator('.kintsugi-fragment')).toHaveCount(3);
    await expect(bowl.locator('.kintsugi-gold')).toHaveCount(2);
    await expect
      .poll(() => bowl.locator('.kintsugi-gold').last().evaluate((el) => (
        (parseFloat(getComputedStyle(el).strokeDasharray) || 0) >= el.getTotalLength() - 0.5
      )), { timeout: 6_000 })
      .toBe(true);

    // Link simples (sem botão aninhado) que leva de volta à home e desfaz a névoa
    const back = page.getByRole('link', { name: 'Voltar ao início' });
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
    // Interceptar todos os chunks deixa a carga lenta sob a suíte inteira: mais folga aqui
    await expect(page.locator('[data-scene="fallback"] svg')).toHaveCount(1, { timeout: 20_000 });
    await expect(loader(page)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('.hero-title')).toBeVisible();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
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
      // Chunks ainda chegando quando o teste acaba não podem derrubar o route.fetch
      await page.unrouteAll({ behavior: 'ignoreErrors' });
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
