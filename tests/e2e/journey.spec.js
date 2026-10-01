import { test, expect } from '@playwright/test';

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('.hero-title')).toBeVisible({ timeout: 15_000 });
}

async function scrollToSection(page, id) {
  await page.evaluate((sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ block: 'center' });
  }, id);
}

// Rola e confere; se o layout ainda mudou depois do scroll (pin do emakimono recalculando),
// rola de novo até a seção ativa bater
async function expectSection(page, id) {
  await expect(async () => {
    await scrollToSection(page, id);
    await expect(page.locator('html')).toHaveAttribute('data-section', id, { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
}

test('a seção ativa acompanha o scroll', async ({ page }) => {
  await openHome(page);
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-section', 'hero');
  for (const id of ['about', 'stack', 'experience']) {
    await expectSection(page, id);
  }
});

test('as estações avançam do topo ao fim da página', async ({ page }) => {
  await openHome(page);
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-season', 'spring');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(html).toHaveAttribute('data-season', 'winter');
});

test('rotas fora da home ficam congeladas no outono', async ({ page }) => {
  await page.goto('/certificates');
  await expect(page.locator('html')).toHaveAttribute('data-season', 'autumn');
});

test('Lenis fica ativo por padrão', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/);
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Lenis fica desligado e as seções ainda são detectadas', async ({ page }) => {
    await openHome(page);
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/(^|\s)lenis(\s|$)/);
    await expectSection(page, 'stack');
  });
});
