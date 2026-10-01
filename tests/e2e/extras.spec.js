import { test, expect, devices } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

const loader = (page) => page.locator('[data-loader="enso"]');

async function openHome(page) {
  await page.goto('/');
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
}

async function scrollToContact(page) {
  await page.evaluate(() => {
    const el = document.getElementById('contato');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
  });
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

test.describe('Loader ensō (円相) de pincel', () => {
  test('o traço tem corpo de tinta e cerdas, revelado por máscara', async ({ page }) => {
    await page.goto('/');
    const brush = page.locator('[data-enso-brush]');
    await expect(brush).toHaveAttribute('mask', 'url(#enso-brush)');
    // Corpo + muitas cerdas finas + riscos de papel
    expect(await brush.locator('path').count()).toBeGreaterThan(40);
    await expect(page.locator('#enso-brush path')).toHaveCount(1);
  });

  test('a máscara pinta o traço progressivamente e o loader some', async ({ page }) => {
    await page.goto('/');
    const guide = page.locator('#enso-brush path');
    // DrawSVG aplica o dash no guia: em algum momento parte do traço está desenhada
    await expect
      .poll(() => guide.evaluate((p) => getComputedStyle(p).strokeDasharray), { timeout: 5_000 })
      .not.toBe('none');
    await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
  });
});

test.describe('Lanterna com o nome (灯籠流し)', () => {
  test('o primeiro nome de quem escreveu vai pintado no papel', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await openHome(page);
    await scrollToContact(page);
    await page.getByLabel('Nome').fill('Ana Souza');
    await page.getByLabel('Email').fill('ana@example.com');
    await page.getByLabel('Mensagem').fill('Olá!');
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();

    const name = page.locator('[data-lantern-release] .paper-lantern-name');
    await expect(name).toHaveText('Ana');
    // Nome curto: escrita vertical (tategaki)
    await expect(name).toHaveCSS('writing-mode', 'vertical-rl');
    await expect(page.locator('[data-lantern-release]')).toHaveCount(0, { timeout: 8_000 });
  });

  test('o nome entra como texto, nunca como HTML', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await openHome(page);
    await scrollToContact(page);
    await page.getByLabel('Nome').fill('<img src=x onerror=alert(1)>');
    await page.getByLabel('Email').fill('x@example.com');
    await page.getByLabel('Mensagem').fill('teste');
    let dialog = false;
    page.on('dialog', (d) => {
      dialog = true;
      return d.dismiss();
    });
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect(page.locator('[data-lantern-release]')).toHaveCount(1);
    await expect(page.locator('[data-lantern-release] img')).toHaveCount(0);
    expect(dialog).toBe(false);
  });
});

test.describe('Página de projeto (作)', () => {
  test('cabeçalho de emakimono, links e navegação entre projetos', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/projects/totem-autoatendimento');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Totem de Auto-atendimento');
    await expect(page.locator('.project-eyebrow')).toContainText('04 / 11');
    await expect(page.locator('.project-rod')).toHaveCount(2);
    await expect(page.getByRole('link', { name: /Acessar Projeto/ })).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('link', { name: /Ver no GitHub/ })).toHaveAttribute('rel', /noopener/);
    // Com imagens: galeria aparece
    await expect(page.locator('.project-gallery')).toHaveCount(1);

    const nav = page.getByRole('navigation', { name: 'Projeto' });
    await expect(nav.getByRole('link', { name: /Projeto anterior/ })).toHaveAttribute('href', '/projects/fit-ai-api');
    await nav.getByRole('link', { name: /Próximo projeto/ }).click();
    await expect(page).toHaveURL(/\/projects\/devflix-frontend$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('DevFlix');
    expect(errors).toEqual([]);
  });

  test('sem imagens não mostra galeria vazia; o primeiro não tem "anterior"', async ({ page }) => {
    await page.goto('/projects/imacardios');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('IMACARDIOS');
    await expect(page.locator('.project-gallery')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Projeto anterior/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Próximo projeto/ })).toHaveAttribute('href', '/projects/fit-ai-frontend');
    // Sem repositório público: só o botão de acesso
    await expect(page.getByRole('link', { name: /Ver no GitHub/ })).toHaveCount(0);
  });

  test('o título fica inteiro (SplitText não quebra o texto do heading)', async ({ page }) => {
    await page.goto('/projects/fit-ai-api');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('FIT.AI — API');
  });

  test.describe('em celular', () => {
    const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
    test.use(pixel);

    test('sem rolagem horizontal e sem marca d\'água em cima do texto', async ({ page }) => {
      await page.goto('/projects/imacardios');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.project-kanji')).toBeHidden();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  });
});

test.describe('Easter egg 千羽鶴', () => {
  test('o código Konami solta o bando de tsurus e mostra o recado', async ({ page }) => {
    await openHome(page);
    for (const key of KONAMI) await page.keyboard.press(key);
    await expect(page.locator('[data-senbazuru] .tsuru')).toHaveCount(14);
    await expect(page.getByText(/千羽鶴/)).toBeVisible();
    // O bando sai de cena e o overlay é removido
    await expect(page.locator('[data-senbazuru]')).toHaveCount(0, { timeout: 10_000 });
  });

  test('cinco carimbadas seguidas no hanko do rodapé também soltam o bando', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const hanko = page.locator('[data-hanko]');
    await expect(hanko).toBeInViewport();
    // Espera o scroll suave (Lenis) assentar antes de mirar no carimbo
    await page.waitForTimeout(1500);
    const box = await hanko.boundingBox();
    const click = () => page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 4; i++) await click();
    await expect(page.locator('[data-senbazuru]')).toHaveCount(0);
    await click();
    await expect(page.locator('[data-senbazuru]')).toHaveCount(1);
  });

  test('digitar a sequência dentro do formulário não dispara', async ({ page }) => {
    await openHome(page);
    await scrollToContact(page);
    await page.getByLabel('Mensagem').click();
    for (const key of KONAMI) await page.keyboard.press(key);
    await page.waitForTimeout(400);
    await expect(page.locator('[data-senbazuru]')).toHaveCount(0);
  });

  test.describe('com prefers-reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('os tsurus aparecem parados e somem, sem voo', async ({ page }) => {
      await openHome(page);
      for (const key of KONAMI) await page.keyboard.press(key);
      await expect(page.locator('[data-senbazuru] .tsuru')).toHaveCount(14);
      await expect(page.locator('[data-senbazuru]')).toHaveCount(0, { timeout: 5_000 });
    });
  });
});
