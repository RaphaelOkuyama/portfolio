import { test, expect, devices } from '@playwright/test';

test('cursor de tinta aparece com rastro e cresce sobre links', async ({ page }) => {
  await page.goto('/certificates');
  const dot = page.locator('[data-cursor="ink"]');
  await expect(dot).toHaveCount(1);
  await expect(page.locator('[data-cursor-trail]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Projetos' }).first().hover();
  await expect(dot).toHaveAttribute('data-hover', 'true');
});

// Onde o rastro termina na tela (px de CSS), na linha y: o pixel pintado mais à direita,
// convertido da resolução do canvas para a posição exibida
const trailEndAt = (page, y) =>
  page.evaluate((row) => new Promise((resolve) => {
    requestAnimationFrame(() => {
      const c = document.querySelector('[data-cursor-trail]');
      const ctx = c.getContext('2d');
      const scaleY = c.height / c.clientHeight;
      const data = ctx.getImageData(0, Math.round(row * scaleY), c.width, 1).data;
      let right = -1;
      for (let i = 0; i < c.width; i++) if (data[i * 4 + 3] > 20) right = i;
      resolve(right < 0 ? null : right * (c.clientWidth / c.width));
    });
  }), y);

test('o rastro sai do centro do ponto mesmo com barra de rolagem', async ({ page }) => {
  await page.goto('/certificates');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
  const canvas = page.locator('[data-cursor-trail]');
  // Simula a barra de rolagem do Windows: o canvas fica 60px mais estreito que a janela
  await canvas.evaluate((el) => { el.style.width = 'calc(100% - 60px)'; });
  await expect
    .poll(() => canvas.evaluate((el) => el.width / el.clientWidth / Math.min(window.devicePixelRatio || 1, 2)))
    .toBeCloseTo(1, 2);

  // Traço horizontal terminando em x=1000: o fim do rastro tem de estar no cursor
  for (let x = 800; x <= 1000; x += 10) await page.mouse.move(x, 400);
  // Com a máquina carregada o quadro do rastro pode ainda não ter sido pintado: lê de novo,
  // reavivando o fim do traço no mesmo ponto, até o desenho aparecer
  let end = null;
  await expect.poll(async () => {
    await page.mouse.move(990, 400);
    await page.mouse.move(1000, 400);
    end = await trailEndAt(page, 400);
    return end;
  }, { timeout: 5_000 }).not.toBeNull();
  expect(Math.abs(end - 1000)).toBeLessThan(6);
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
