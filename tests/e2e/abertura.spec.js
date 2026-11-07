import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

// Fase A do redesign cinematográfico: abertura, pôster da cena, qualidade automática, som e hero
const loader = (page) => page.locator('[data-loader="enso"]');
const RTX = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU (0x00002560) Direct3D11 vs_5_0 ps_5_0, D3D11)';

// Faz o WebGL responder com o nome de outra placa de vídeo (a cena continua desenhando por software)
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

const visited = (page) => page.addInitScript(() => localStorage.setItem('oku-visited', '1'));

test.describe('Abertura na primeira visita', () => {
  test('no desktop: fundo de tinta, o ensō escreve 奥山 e a íris abre sobre a hero', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/');
    // O fundo de tinta cobre a página desde o primeiro paint (CSS, antes do JavaScript)
    await expect(loader(page)).toHaveCSS('background-color', 'rgb(15, 22, 38)');
    await expect(loader(page)).toHaveAttribute('data-iris', '', { timeout: 8_000 });
    await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
    expect(await page.evaluate(() => localStorage.getItem('oku-visited'))).toBe('1');
    // A hero termina nítida e no lugar
    await expect(page.locator('.hero-title')).toHaveCSS('filter', 'none');
    expect(errors).toEqual([]);
  });

  test('um clique pula a abertura', async ({ page }) => {
    await page.goto('/');
    // O pincel começou: o JavaScript da abertura já está ouvindo o clique
    await expect(page.locator('[data-loader="enso"] [data-shodo]')).toBeVisible();
    await page.mouse.click(640, 360);
    await expect(loader(page)).toHaveCount(0, { timeout: 3_500 });
  });

  test.describe('no celular', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('só o ensō sobre a hero, sem o fundo de tinta', async ({ page }) => {
      await page.goto('/');
      await expect(loader(page)).toBeVisible();
      expect(await loader(page).evaluate((el) => getComputedStyle(el).backgroundImage)).toMatch(/radial-gradient/);
      await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
    });
  });
});

test.describe('Pôster da cena', () => {
  test('a home abre com o quadro da própria cena, do tema e da orientação da tela', async ({ page }) => {
    await visited(page);
    const poster = page.waitForResponse((r) => r.url().includes('/poster/night-wide') && r.status() === 200);
    await page.goto('/');
    await poster;
    const frame = page.locator('.scene-poster-frame');
    expect(await frame.evaluate((el) => getComputedStyle(el).backgroundImage)).toMatch(/poster\/night-wide/);
    await page.getByRole('button', { name: 'Alternar dia/noite' }).first().click();
    await expect.poll(() => frame.evaluate((el) => getComputedStyle(el).backgroundImage)).toMatch(/poster\/day-wide/);
  });

  test.describe('em pé', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('usa o quadro vertical', async ({ page }) => {
      await visited(page);
      await page.goto('/');
      expect(await page.locator('.scene-poster-frame').evaluate((el) => getComputedStyle(el).backgroundImage)).toMatch(/poster\/night-tall/);
    });
  });
});

test.describe('Qualidade automática', () => {
  test('uma placa dedicada começa no alto, e a escolha da pessoa passa a valer', async ({ page }) => {
    await fakeGpu(page, RTX);
    await visited(page);
    await page.goto('/');
    // GPU boa e mouse: a cena começa sozinha, sem esperar interação
    await expect(page.getByRole('button', { name: 'Gráficos: Alto (automático)' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Gráficos: Alto/ }).click();
    await expect(page.locator('.quality-auto')).toBeVisible();
    await page.getByRole('radio', { name: /Médio/ }).click();
    await expect(page.getByRole('button', { name: 'Gráficos: Médio' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Gráficos: Médio' })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Som ambiente', () => {
  test('desligado por padrão; liga, fica salvo e desliga', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await visited(page);
    await page.goto('/');
    const on = page.getByRole('button', { name: 'Ligar o som ambiente' }).first();
    await expect(on).toHaveAttribute('aria-pressed', 'false');
    // O botão vem pronto do servidor: o clique só vale depois da hidratação do React
    await page.waitForFunction(() => {
      const button = document.querySelector('.sound-toggle');
      return button && Object.keys(button).some((key) => key.startsWith('__react'));
    });
    await on.click();
    // O código do som só baixa no primeiro clique: com a suíte em paralelo pode demorar
    const off = page.getByRole('button', { name: 'Desligar o som ambiente' }).first();
    await expect(off).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
    expect(await page.evaluate(() => localStorage.getItem('oku-sound'))).toBe('on');
    await off.click();
    await expect(page.getByRole('button', { name: 'Ligar o som ambiente' }).first()).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('oku-sound'))).toBe('off');
    expect(errors).toEqual([]);
  });
});

test.describe('Hero', () => {
  test('texto à esquerda, 奥山 em pé ao lado do nome e o conceito na seta', async ({ page }) => {
    await visited(page);
    await page.goto('/');
    await expect(page.locator('.hero-okuyama')).toHaveCSS('writing-mode', 'vertical-rl');
    const copy = await page.locator('.hero-copy').boundingBox();
    expect(copy.x + copy.width).toBeLessThan(page.viewportSize().width * 0.62);
    await expect(page.locator('.hero-name-family')).toHaveText('Okuyama');
    await expect(page.locator('.hero-scroll-cue')).toHaveText('奥山 quer dizer montanha profunda. Role para entrar.', { useInnerText: true });
    await expect(page.getByRole('navigation').first().getByRole('link', { name: 'Início' })).toBeVisible();
  });

  test('kana e kanji na Shippori Mincho do site, não na fonte do sistema', async ({ page }) => {
    await visited(page);
    await page.goto('/');
    const family = await page.locator('.hero-okuyama').evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).not.toMatch(/^['"]?Hiragino/);
    await expect.poll(() => page.evaluate(() => {
      const first = getComputedStyle(document.querySelector('.hero-okuyama')).fontFamily.split(',')[0];
      return document.fonts.check(`800 64px ${first}`, '奥山');
    })).toBe(true);
  });
});
