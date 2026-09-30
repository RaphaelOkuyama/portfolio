import { test, expect, devices } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

// Rola até uma fração do trecho fixado (0 = início do pin, 1 = fim)
async function scrollProjects(page, fraction) {
  await page.evaluate((f) => {
    const section = document.getElementById('projects');
    const top = section.getBoundingClientRect().top + window.scrollY;
    const pinLength = section.offsetHeight - window.innerHeight;
    window.scrollTo(0, top + Math.max(0, pinLength) * f);
  }, fraction);
}

const trackX = (page) =>
  page.locator('.emaki-track').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);

test('o emakimono lista os projetos com o IMACARDIOS primeiro', async ({ page }) => {
  await openHome(page);
  const panels = page.locator('.emaki-panel');
  await expect(panels).toHaveCount(11);
  await expect(panels.first()).toContainText('IMACARDIOS');
  await expect(panels.first()).toHaveAttribute('href', '/projects/imacardios');
});

test('o scroll vertical desenrola o rolo na horizontal com a seção fixada', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 0.05);
  await page.waitForTimeout(800);
  const headerStart = await page.locator('.emaki-header').boundingBox();
  const xStart = await trackX(page);

  await scrollProjects(page, 0.7);
  await expect.poll(() => trackX(page), { timeout: 5_000 }).toBeLessThan(xStart - 300);
  const headerLater = await page.locator('.emaki-header').boundingBox();
  // Seção fixada: o título não sai do lugar enquanto o rolo anda
  expect(Math.abs(headerLater.y - headerStart.y)).toBeLessThan(4);
});

test('os painéis se desenrolam ao entrar e o último fica aberto no fim', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 1);
  const last = page.locator('.emaki-panel').last();
  await expect
    .poll(() => last.evaluate((el) => getComputedStyle(el).clipPath), { timeout: 5_000 })
    .not.toContain('100%');
});

test('focar um painel fora da tela rola o rolo até ele', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 0);
  const target = page.locator('.emaki-panel').nth(7);
  await target.focus();
  await expect
    .poll(async () => {
      const box = await target.boundingBox();
      const width = page.viewportSize().width;
      return box.x >= 0 && box.x + box.width <= width;
    }, { timeout: 5_000 })
    .toBe(true);
});

test('clicar num painel expande e abre o projeto', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 0.02);
  await page.waitForTimeout(800);
  await page.locator('.emaki-panel').first().click();
  await expect(page.locator('.emaki-expand')).toHaveCount(1);
  await expect(page).toHaveURL(/\/projects\/imacardios$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('IMACARDIOS');
  await expect(page.locator('.emaki-expand')).toHaveCount(0, { timeout: 5_000 });
});

test('o link "Ver todos os projetos" leva para a lista', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 1);
  await page.getByRole('link', { name: 'Ver todos os projetos' }).click();
  await expect(page).toHaveURL(/\/projects$/);
});

test('percorrer o emakimono nos dois temas não gera erros', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  for (const theme of ['night', 'day']) {
    if (theme === 'day') {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByRole('button', { name: 'Alternar dia/noite' }).first().click();
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const f of [0, 0.5, 1]) {
      await scrollProjects(page, f);
      await expect(page.locator('html')).toHaveAttribute('data-section', 'projects');
    }
  }
  expect(errors).toEqual([]);
});

test.describe('em celular', () => {
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  test.use(pixel);

  test('o rolo é arrastável e a seção não fica fixada', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => document.getElementById('projects').scrollIntoView());
    const sectionHeight = await page.locator('#projects').evaluate((el) => el.offsetHeight);
    // Sem pin: a seção tem só a altura do conteúdo
    expect(sectionHeight).toBeLessThan(page.viewportSize().height * 1.6);

    const box = await page.locator('.emaki-track').boundingBox();
    const before = await trackX(page);
    await page.mouse.move(box.x + 300, box.y + 120);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + 120, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => trackX(page), { timeout: 5_000 }).toBeLessThan(before - 100);
  });
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('os projetos viram uma grade estática e o clique abre direto', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.emaki-track')).toHaveCSS('display', 'grid');
    expect(await trackX(page)).toBe(0);
    const first = page.locator('.emaki-panel').first();
    await first.scrollIntoViewIfNeeded();
    await first.click();
    await expect(page).toHaveURL(/\/projects\/imacardios$/);
    await expect(page.locator('.emaki-expand')).toHaveCount(0);
  });
});
