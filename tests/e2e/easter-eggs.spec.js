import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

const loader = (page) => page.locator('[data-loader="enso"]');

async function openHome(page) {
  await page.goto('/');
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
}

test.describe('領域展開: Expansão de domínio', () => {
  test('digitar "domain" abre o Vazio Infinito e o Esc quebra o domínio', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await openHome(page);
    await page.keyboard.type('domain');
    const domain = page.locator('[data-domain]');
    await expect(domain).toHaveCount(1);
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape');
    // Saída: saturação curta + reconstrução do site (~2–3 s; mais com a máquina carregada)
    await expect(domain).toHaveCount(0, { timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('digitar dentro de um campo não abre o domínio', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => {
      const el = document.getElementById('contato');
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    });
    await page.locator('#contact-message').fill('');
    await page.locator('#contact-message').pressSequentially('domain');
    await page.waitForTimeout(300);
    await expect(page.locator('[data-domain]')).toHaveCount(0);
  });

  test('segurar o kanji 技 da placa do Stack também abre', async ({ page }) => {
    await openHome(page);
    const kanji = page.locator('[data-station="stack"] .section-kanji');
    await kanji.scrollIntoViewIfNeeded();
    const box = await kanji.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    await expect(page.locator('[data-domain]')).toHaveCount(1);
  });
});
