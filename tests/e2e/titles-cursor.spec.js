import { test, expect } from '@playwright/test';

const SLUGS = ['imacardios', 'fit-ai-frontend', 'fit-ai-api', 'totem-autoatendimento', 'devflix-frontend', 'devflix-backend', 'player-electron', 'react-kanban', 'api-leadmagnet', 'api-library', 'star-wars-catalog'];

async function waitLoader(page) {
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

// Quanto a linha mais larga do texto passa da caixa do elemento (px)
const overflowOf = (page, selector) =>
  page.locator(selector).first().evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const right = Math.max(...[...range.getClientRects()].map((r) => r.right));
    return Math.round(right - el.getBoundingClientRect().right);
  });

test.describe('Nome dos projetos', () => {
  for (const [label, width, height] of [['desktop', 1440, 900], ['celular pequeno', 320, 640]]) {
    test.describe(label, () => {
      test.use({ viewport: { width, height }, reducedMotion: 'reduce' });

      test('nenhum título de projeto passa da caixa nem faz a página rolar de lado', async ({ page }) => {
        // Percorre as 11 páginas num teste só: com a suíte toda rodando, 60s ficava no limite
        test.setTimeout(150_000);
        for (const slug of SLUGS) {
          await page.goto(`/projects/${slug}`);
          await expect(page.locator('.case-title')).toBeVisible();
          expect(await overflowOf(page, '.case-title'), `${slug} título`).toBeLessThanOrEqual(1);
          expect(await overflowOf(page, '.case-next-title'), `${slug} próximo`).toBeLessThanOrEqual(1);
          expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), slug).toBeLessThanOrEqual(0);
        }
      });
    });
  }

  test('com a animação, as palavras do título ficam inteiras e com folga para as pernas das letras', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/projects/imacardios');
    await waitLoader(page);
    const masks = page.locator('.case-title .case-word-mask');
    await expect(masks.first()).toBeAttached();
    // Folga embaixo para g, p, y (antes a máscara cortava rente à letra)
    const padBottom = await masks.first().evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
    expect(padBottom).toBeGreaterThan(4);
    // Cada palavra numa linha só: nunca partida entre letras (IMACA / RDIOS)
    const broken = await page.locator('.case-title .case-word').evaluateAll((words) =>
      words.filter((w) => new Set([...w.children].map((c) => Math.round(c.getBoundingClientRect().top))).size > 1).map((w) => w.textContent));
    expect(broken).toEqual([]);
    await expect(page.locator('h1')).toHaveText('IMACARDIOS: Telemedicina e Telelaudos');
  });

  test('o título do próximo projeto termina sem recorte', async ({ page }) => {
    await page.goto('/projects/fit-ai-api');
    await waitLoader(page);
    await page.locator('.case-next').scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.locator('.case-next-title').evaluate((el) => el.style.clipPath), { timeout: 5_000 })
      .toBe('');
  });

  // "Autoatendimento" não tem hífen; o título em inglês ("Self-Service Kiosk") tem
  test.describe('em inglês', () => {
    test.use({ locale: 'en-US' });

  test('palavra composta não quebra no hífen em nenhuma lista', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const [path, selector] of [['/projects', 'main h2'], ['/', '.emaki-title'], ['/projects/totem-autoatendimento', '.case-title']]) {
      await page.goto(path);
      await waitLoader(page);
      const word = page.locator(selector).filter({ hasText: 'Kiosk' }).locator('.nowrap');
      await expect(word, path).toHaveText('Self-Service');
      // Espera a entrada do título assentar: durante a animação as letras estão em alturas diferentes
      await expect
        .poll(() => word.evaluate((el) => {
          // Título animado: mede as letras (folhas do SplitText), não as máscaras com folga.
          // Texto simples: mede as linhas do próprio texto
          const letters = [...el.querySelectorAll('*')].filter((n) => !n.children.length);
          if (letters.length) return new Set(letters.map((n) => Math.round(n.getBoundingClientRect().top))).size;
          const range = document.createRange();
          range.selectNodeContents(el);
          return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
        }), { message: path, timeout: 5_000 })
        .toBe(1);
    }
  });
  });
});

test.describe('Cursor de tinta', () => {
  test('a seta do sistema não aparece em nenhum elemento', async ({ page }) => {
    test.setTimeout(120_000);
    for (const path of ['/', '/projects/totem-autoatendimento', '/certificates']) {
      await page.goto(path);
      await waitLoader(page);
      const visible = await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return r.width && r.height && cs.pointerEvents !== 'none' && cs.cursor !== 'none';
          })
          .map((el) => `${el.tagName.toLowerCase()}.${el.className} → ${getComputedStyle(el).cursor}`));
      expect(visible, path).toEqual([]);
    }
  });

  test('a ponta do rastro coincide com o centro do ponto', async ({ page }) => {
    // Sem WebGL (fundo estático): aqui a cena roda em software e cada quadro dela levava mais que a
    // vida do rastro (260ms); a linha sumia antes da leitura e o teste falhava ao acaso
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
        return /webgl/.test(type) ? null : original.call(this, type, ...rest);
      };
    });
    await page.goto('/certificates');
    await waitLoader(page);
    await page.mouse.move(700, 420);
    await page.mouse.move(1000, 420, { steps: 20 });
    const r = await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => {
        const dot = document.querySelector('[data-cursor="ink"]').getBoundingClientRect();
        const c = document.querySelector('[data-cursor-trail]');
        const s = c.width / c.clientWidth;
        const row = c.getContext('2d').getImageData(0, Math.round(420 * s), c.width, 1).data;
        let right = -1;
        for (let i = 0; i < c.width; i++) if (row[i * 4 + 3] > 20) right = i;
        resolve({ dot: dot.left + dot.width / 2, trail: right < 0 ? null : right / s });
      });
    }));
    expect(r.trail).not.toBeNull();
    expect(Math.abs(r.dot - 1000)).toBeLessThan(1);
    // A linha termina no centro (+ meia espessura da ponta arredondada)
    expect(Math.abs(r.trail - r.dot)).toBeLessThan(5);
  });
});
