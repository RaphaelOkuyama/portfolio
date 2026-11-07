import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

// Fase B do redesign cinematográfico: gradação de cor, luz da cena, texturas do Poly Haven e o
// respiro de nanquim entre capítulos
const RTX = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU (0x00002560) Direct3D11 vs_5_0 ps_5_0, D3D11)';

async function fakeGpu(page, name) {
  await page.addInitScript((gpu) => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      const ctx = original.call(this, type, ...args);
      if (!ctx || !/webgl/i.test(type)) return ctx;
      const getParameter = ctx.getParameter.bind(ctx);
      ctx.getParameter = (p) => (p === 0x9246 ? gpu : getParameter(p));
      return ctx;
    };
  }, name);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('oku-visited', '1'));
});

test('no alto a gradação de cor liga e a vinheta pintada do papel sai', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await fakeGpu(page, RTX);
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/has-grade/, { timeout: 30_000 });
  expect(await page.locator('.washi').evaluate((el) => getComputedStyle(el, '::after').display)).toBe('none');
  expect(errors).toEqual([]);
});

test('no mínimo não há pós-processamento', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('oku-quality', 'low'));
  await page.goto('/');
  await page.mouse.move(400, 300);
  await expect(page.locator('[data-scene="webgl"] canvas')).toHaveCount(1, { timeout: 15_000 });
  await page.waitForTimeout(1500);
  await expect(page.locator('html')).not.toHaveClass(/has-grade/);
});

test('as texturas do Poly Haven chegam com a cena', async ({ page }) => {
  const stone = page.waitForResponse((r) => r.url().endsWith('/textures/stone.jpg') && r.status() === 200, { timeout: 30_000 });
  const ground = page.waitForResponse((r) => r.url().endsWith('/textures/ground.jpg') && r.status() === 200, { timeout: 30_000 });
  await page.goto('/');
  await page.mouse.move(400, 300);
  await Promise.all([stone, ground]);
});

test('o nanquim avança pelas bordas na virada de capítulo e recua no meio da seção', async ({ page }) => {
  await page.goto('/');
  const ink = page.locator('[data-scene] .ink-breath');
  await expect(ink).toHaveCount(1);
  // As seções medem as faixas depois de montar: rola de novo a cada tentativa até a medida valer
  const at = (where) => page.evaluate((w) => {
    const s = document.getElementById('stack');
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, (w === 'start' ? top : top + s.offsetHeight / 2) - window.innerHeight / 2);
  }, where);
  // Começo do Stack: a borda escurece
  await expect.poll(async () => {
    await at('start');
    await page.waitForTimeout(400);
    return ink.evaluate((el) => Number(el.style.opacity || 0));
  }, { timeout: 15_000 }).toBeGreaterThan(0.3);
  // Meio da seção: a tela fica limpa
  await expect.poll(async () => {
    await at('middle');
    await page.waitForTimeout(400);
    return ink.evaluate((el) => Number(el.style.opacity || 0));
  }, { timeout: 15_000 }).toBeLessThan(0.05);
});
