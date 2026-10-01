import { test, expect } from '@playwright/test';

async function openAt(page, path = '/certificates') {
  await page.goto(path);
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

// Quanto a assinatura OKUYAMA sobra ou falta em relação à largura disponível
const wordmarkFit = (page) =>
  page.evaluate(() => {
    const wrap = document.querySelector('.sf-wordmark').getBoundingClientRect();
    const text = document.querySelector('.sf-wordmark-text').getBoundingClientRect();
    const kanji = document.querySelector('.sf-wordmark-kanji');
    const kanjiVisible = getComputedStyle(kanji).display !== 'none';
    return {
      overflow: Math.round(text.right - wrap.right),
      kanjiInside: !kanjiVisible || kanji.getBoundingClientRect().right <= wrap.right + 1,
      fill: text.width / wrap.width,
      page: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

test.describe('Rodapé (終)', () => {
  test('sem a frase de tecnologias e com navegação, redes e relógios', async ({ page }) => {
    await openAt(page);
    const footer = page.locator('footer');
    await expect(footer).not.toContainText('Feito com');
    await expect(footer.getByRole('navigation', { name: 'Navegação' }).getByRole('link')).toHaveCount(4);
    await expect(footer.getByRole('link', { name: /GitHub/ })).toHaveAttribute('target', '_blank');
    await expect(footer.getByRole('link', { name: /E-mail/ })).toHaveAttribute('href', 'mailto:raphaelokuyama123@gmail.com');
    // Relógios de São Paulo e Tóquio no formato HH:MM, com 12h de diferença
    const sp = await footer.locator('[data-clock="saoPaulo"]').textContent();
    const tk = await footer.locator('[data-clock="tokyo"]').textContent();
    expect(sp).toMatch(/^\d{2}:\d{2}$/);
    expect(tk).toMatch(/^\d{2}:\d{2}$/);
    const diff = (Number(tk.slice(0, 2)) - Number(sp.slice(0, 2)) + 24) % 24;
    expect(diff).toBe(12);
  });

  test('voltar ao topo sobe a página', async ({ page }) => {
    await openAt(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await page.getByRole('button', { name: 'Voltar ao topo' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBeLessThan(5);
  });

  for (const [label, motion] of [['animação normal', 'no-preference'], ['movimento reduzido', 'reduce']]) {
    test.describe(label, () => {
      test.use({ reducedMotion: motion });

      for (const [w, h] of [[1920, 1080], [1440, 900], [768, 1024], [390, 844], [320, 640]]) {
        test(`a assinatura OKUYAMA ocupa a largura sem vazar em ${w}px`, async ({ page }) => {
          await page.setViewportSize({ width: w, height: h });
          await openAt(page);
          await expect
            .poll(async () => {
              const r = await wordmarkFit(page);
              return r.overflow <= 1 && r.kanjiInside && r.page <= 0 && r.fill > 0.75;
            }, { timeout: 5_000 })
            .toBe(true);
        });
      }
    });
  }
});
