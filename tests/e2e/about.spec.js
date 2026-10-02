import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

async function scrollToAbout(page, offset = 0) {
  await page.evaluate((o) => {
    const el = document.getElementById('about');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + o);
  }, offset);
}

test('o texto do Sobre é dividido em linhas e continua completo', async ({ page }) => {
  await openHome(page);
  const text = page.locator('.about-text');
  await expect(text).toContainText('Sou descendente de japoneses');
  await expect(text).toContainText('xadrez');
  expect(await page.locator('.about-line').count()).toBeGreaterThan(1);
});

test('as linhas se revelam ao rolar pela seção', async ({ page }) => {
  await openHome(page);
  await scrollToAbout(page, 400);
  const lastLine = page.locator('.about-line').last();
  await expect.poll(() => lastLine.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5_000 }).toBeGreaterThan(0.9);
});

test('o kakejiku desenrola a foto ao entrar na tela', async ({ page }) => {
  await openHome(page);
  await scrollToAbout(page, 0);
  const photo = page.locator('.kakejiku-photo');
  await expect(photo.locator('img')).toHaveAttribute('alt', 'Raphael Okuyama');
  await expect
    .poll(() => photo.evaluate((el) => getComputedStyle(el).clipPath), { timeout: 5_000 })
    .not.toContain('100%');
});

test('baixar o currículo carimba o hanko e mantém o download', async ({ page }) => {
  await openHome(page);
  await scrollToAbout(page, 0);
  const link = page.getByRole('link', { name: 'Baixar currículo' });
  await expect(link).toHaveAttribute('href', '/curriculo.pdf');
  const download = page.waitForEvent('download');
  await link.click();
  await expect(page.locator('[data-stamp]')).toBeVisible();
  expect((await download).suggestedFilename()).toBe('Raphael_Okuyama_CV.pdf');
});

test('trocar o idioma refaz a divisão em linhas', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Mudar idioma para inglês' }).first().click();
  await expect(page.locator('.about-text')).toContainText('I am of Japanese descent');
  expect(await page.locator('.about-line').count()).toBeGreaterThan(1);
});

test('percorrer Sobre e Stack nos dois temas não gera erros', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  for (const theme of ['night', 'day']) {
    if (theme === 'day') await page.getByRole('button', { name: 'Alternar dia/noite' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const id of ['about', 'stack']) {
      await page.evaluate((sectionId) => document.getElementById(sectionId).scrollIntoView({ block: 'center' }), id);
      await expect(page.locator('html')).toHaveAttribute('data-section', id);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  expect(errors).toEqual([]);
});

test('a história vem com os dois sobrenomes e o atalho para o contato', async ({ page }) => {
  await openHome(page);
  await scrollToAbout(page, 0);
  const about = page.locator('#about');
  await expect(about.locator('.about-lead')).toHaveText('Minha história começa muito antes do código.');
  await expect(about.locator('.about-name')).toHaveCount(2);
  await expect(about.locator('.about-name-kanji')).toHaveText(['奥山', '芳賀']);
  await expect(about.locator('.about-name').first()).toContainText('família do pai');
  await expect(about.locator('.about-name').last()).toContainText('família da mãe');
  await expect(about.locator('.about-stats')).toHaveCount(0);
  await about.getByRole('link', { name: 'Fale comigo' }).click();
  await expect(page).toHaveURL(/#contato$/);
});

test.describe('em celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a foto vem antes do texto', async ({ page }) => {
    await openHome(page);
    const photo = await page.locator('#about .kakejiku').boundingBox();
    const title = await page.locator('#about .section-title').boundingBox();
    expect(photo.y).toBeLessThan(title.y);
  });
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('texto sem divisão animada e foto já aberta', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.about-line')).toHaveCount(0);
    await expect(page.locator('.about-text')).toBeVisible();
    await scrollToAbout(page, 0);
    const clip = await page.locator('.kakejiku-photo').evaluate((el) => getComputedStyle(el).clipPath);
    expect(clip).not.toContain('100%');
  });
});
