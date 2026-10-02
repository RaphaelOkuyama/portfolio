import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

test.describe('Hero', () => {
  test('frase de valor, disponibilidade e os dois atalhos', async ({ page }) => {
    await openHome(page);
    const hero = page.locator('#hero');
    await expect(hero.locator('.hero-summary')).toHaveText('Desenvolvo sistemas que rodam de verdade: meu código atende 42+ clínicas e assina 2.000+ laudos por mês.', { useInnerText: true });
    await expect(hero.locator('.hero-available')).toHaveText('Disponível para CLT · PJ · Freelance', { useInnerText: true });
    await expect(hero.getByRole('link', { name: 'Ver projetos' })).toHaveAttribute('href', '/#projects');
    await hero.getByRole('link', { name: 'Fale comigo' }).click();
    await expect(page).toHaveURL(/#contato$/);
  });
});

test.describe('Trilho de seções (山 人 技 作 歩 縁)', () => {
  test('acende a seção atual e leva até a escolhida', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await openHome(page);
    const rail = page.getByRole('navigation', { name: 'Seções da página' });
    const links = rail.getByRole('link');
    await expect(links).toHaveCount(6);
    await expect(links.first()).toHaveAttribute('aria-current', 'location');
    await rail.getByRole('link', { name: /Experiência/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-section', 'experience', { timeout: 6_000 });
    await expect(rail.getByRole('link', { name: /Experiência/ })).toHaveAttribute('aria-current', 'location');
    expect(errors).toEqual([]);
  });

  test.describe('no celular', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('o trilho some e fica só o selo da seção atual', async ({ page }) => {
      await openHome(page);
      await expect(page.locator('.section-rail')).toBeHidden();
      await expect(page.locator('.section-chip')).toContainText('Início');
    });
  });
});

test.describe('Idioma', () => {
  test('a escolha fica salva depois de recarregar', async ({ page }) => {
    await openHome(page);
    await page.getByRole('button', { name: 'Mudar idioma para inglês' }).first().click();
    await expect(page.locator('#hero .hero-summary')).toHaveText(/^I build software that runs for real/, { useInnerText: true });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('link', { name: 'See projects' })).toBeVisible();
  });

  test.describe('navegador em inglês', () => {
    test.use({ locale: 'en-US' });

    test('abre direto em inglês', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('#hero .hero-available')).toHaveText(/^Available for/, { useInnerText: true });
    });
  });
});

test('a home tem o próprio cartão de compartilhamento', async ({ page, request }) => {
  await page.goto('/');
  const url = new URL(await page.locator('meta[property="og:image"]').getAttribute('content'));
  expect(url.pathname).toBe('/opengraph-image');
  const image = await request.get(url.pathname + url.search);
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toBe('image/png');
});

test('trocar o idioma no meio da página não pula a rolagem nem apaga o texto do emakimono', async ({ page }) => {
  const warnings = [];
  page.on('console', (m) => /Invalid scope/.test(m.text()) && warnings.push(m.text()));
  await openHome(page);
  await page.evaluate(() => window.scrollTo(0, document.getElementById('experience').offsetTop + 100));
  await expect(page.locator('html')).toHaveAttribute('data-section', 'experience', { timeout: 6_000 });
  const before = await page.evaluate(() => window.scrollY);
  await page.getByRole('button', { name: 'Mudar idioma para inglês' }).first().click();
  await expect(page.locator('#experience .section-title')).toContainText('Professional Experience');
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => window.scrollY);
  expect(Math.abs(after - before)).toBeLessThan(120);
  await expect(page.locator('html')).toHaveAttribute('data-section', 'experience');
  // O rolo já passou: o texto de todos os painéis continua inteiro
  const opacities = await page.locator('.emaki-panel > *').evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
  expect(Math.min(...opacities)).toBeGreaterThan(0.95);
  expect(warnings).toEqual([]);
});
