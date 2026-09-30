import { test, expect, devices } from '@playwright/test';

async function openStack(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => document.getElementById('stack').scrollIntoView({ block: 'start' }));
}

const tabs = (page) => page.locator('#stack').getByRole('tab');

test('o jardim tem 9 pedras e a primeira começa aberta', async ({ page }) => {
  await openStack(page);
  await expect(tabs(page)).toHaveCount(9);
  await expect(tabs(page).first()).toHaveAttribute('aria-selected', 'true');
  const panel = page.locator('#stack').getByRole('tabpanel');
  await expect(panel).toHaveCount(1); // só o painel ativo fica visível
  await expect(panel).toContainText('TypeScript');
});

test('escolher uma pedra mostra as ferramentas daquela área', async ({ page }) => {
  await openStack(page);
  const backend = page.locator('#stack').getByRole('tab', { name: 'Back-end' });
  await backend.click();
  await expect(backend).toHaveAttribute('aria-selected', 'true');
  await expect(tabs(page).first()).toHaveAttribute('aria-selected', 'false');
  const panel = page.locator('#stack').getByRole('tabpanel');
  await expect(panel).toContainText('NestJS');
  await expect(panel).not.toContainText('TypeScript');
});

test('as setas do teclado navegam entre as pedras', async ({ page }) => {
  await openStack(page);
  await tabs(page).first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs(page).nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs(page).nth(1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(tabs(page).last()).toHaveAttribute('aria-selected', 'true');
});

test('todas as ferramentas continuam no HTML para SEO', async ({ page }) => {
  await openStack(page);
  // Painéis inativos ficam com hidden, mas o texto existe no DOM
  const html = await page.locator('#stack').innerHTML();
  for (const tool of ['NestJS', 'Stripe (Checkout e Webhooks)', 'Playwright', 'Power BI']) {
    expect(html).toContain(tool);
  }
});

test.describe('em celular', () => {
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  test.use(pixel);

  test('as pedras viram uma lista em coluna', async ({ page }) => {
    await openStack(page);
    const first = await tabs(page).nth(0).boundingBox();
    const second = await tabs(page).nth(1).boundingBox();
    expect(Math.abs(first.x - second.x)).toBeLessThan(2);
    expect(second.y).toBeGreaterThan(first.y);
  });
});
