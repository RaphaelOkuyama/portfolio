import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

const loader = (page) => page.locator('[data-loader="enso"]');

async function open(page, url) {
  await page.goto(url);
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
}

const box = (locator) => locator.evaluate((el) => el.getBoundingClientRect().toJSON());

// Rola até um ponto da seção (rolagem nativa: o Lenis acompanha)
async function scrollToSection(page, id, offset = 0) {
  await page.evaluate(([sectionId, off]) => {
    const el = document.getElementById(sectionId);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + off);
  }, [id, offset]);
}

// Laptop de 1280px com o zoom de 150% do Windows (ou janela estreita): o trilho de seções e a barra
// social ficavam por cima do texto
test.describe('Bordas livres no laptop', () => {
  test.use({ viewport: { width: 1200, height: 800 } });

  test('o texto do Sobre começa depois do trilho de seções', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await open(page, '/');
    await scrollToSection(page, 'about');
    const rail = await box(page.locator('.section-rail'));
    const paragraph = await box(page.locator('#about p').first());
    expect(paragraph.left).toBeGreaterThanOrEqual(rail.right + 16);
    const social = await box(page.locator('.social-sidebar'));
    const photo = await box(page.locator('#about img').first());
    expect(photo.right).toBeLessThanOrEqual(social.left - 12);
    expect(errors).toEqual([]);
  });

  test('a barra social não cobre os cartões dos certificados nem o estudo de caso', async ({ page }) => {
    await open(page, '/certificates');
    const social = await box(page.locator('.social-sidebar'));
    const group = await box(page.locator('.cert-board > [data-lang="pt"] .cert-group').first());
    expect(group.right).toBeLessThanOrEqual(social.left - 12);

    await open(page, '/projects/imacardios');
    const meta = await box(page.locator('.case-meta'));
    expect(meta.right).toBeLessThanOrEqual((await box(page.locator('.social-sidebar'))).left - 12);
  });

  test('trilho e barra social somem sobre o rolo do emakimono e no rodapé, e voltam depois', async ({ page }) => {
    await open(page, '/');
    const rail = page.locator('.section-rail');
    const social = page.locator('.social-sidebar');
    await expect(rail).toBeVisible();
    await expect(social).toBeVisible();
    // Rolo fixo na tela: os painéis passam por onde ficam o trilho e a barra
    await scrollToSection(page, 'projects', 700);
    await expect(rail).toHaveAttribute('data-covered', '');
    await expect(rail).toBeHidden();
    await expect(social).toBeHidden();
    // Depois do rolo, de volta
    await scrollToSection(page, 'experience', 120);
    await expect(rail).toBeVisible();
    await expect(social).toBeVisible();
    // O rodapé tem os próprios links
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(social).toBeHidden();
    await expect(rail).toBeHidden();
  });

  test('a linha de leitura do projeto some quando o rodapé chega', async ({ page }) => {
    await open(page, '/projects/saeko-artes');
    const line = page.locator('.case-progress');
    await expect(line).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(line).toBeHidden();
  });
});

test.describe('Selo da seção na navbar (sem o trilho)', () => {
  test.describe('celular', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('mostra o kanji da seção dentro da barra do topo, sem encostar no botão do menu', async ({ page }) => {
      await open(page, '/');
      await expect(page.locator('.section-rail')).toBeHidden();
      // No topo não aparece: o nome do site já diz onde se está
      await expect(page.locator('.nav-section-chip')).toHaveCount(0);
      await scrollToSection(page, 'about', 40);
      const chip = page.locator('.nav-section-chip');
      await expect(chip).toContainText('人');
      // Sem espaço para o nome da seção: só o kanji
      await expect(chip.locator('.nav-section-label')).toBeHidden();
      const nav = await box(page.locator('nav:has(.nav-brand)'));
      const c = await box(chip);
      expect(c.top).toBeGreaterThanOrEqual(nav.top);
      expect(c.bottom).toBeLessThanOrEqual(nav.bottom);
      expect(c.right).toBeLessThan((await box(page.locator('.mobile-menu-btn'))).left - 4);
      expect(c.left).toBeGreaterThan((await box(page.locator('.nav-brand'))).right);
    });
  });

  test.describe('tablet', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('com espaço, o kanji vem com o nome da seção', async ({ page }) => {
      await open(page, '/');
      await scrollToSection(page, 'stack', 40);
      const chip = page.locator('.nav-section-chip');
      await expect(chip).toContainText('技');
      await expect(chip.locator('.nav-section-label')).toBeVisible();
      await expect(chip.locator('.nav-section-label')).toHaveText('Stack');
      expect((await box(chip)).right).toBeLessThan((await box(page.locator('.desktop-menu'))).left);
    });
  });

  test('fora da home não aparece', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1000 });
    await open(page, '/certificates');
    await expect(page.locator('.nav-section')).toHaveCount(0);
  });
});

// Borda direita do texto (não da caixa do elemento)
const textRight = (locator) => locator.evaluate((el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().right;
});

test.describe('Celular deitado (844×390)', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });

  test('o hero cresce com o texto: nada sob a navbar, e a dica de rolar fica embaixo dos botões', async ({ page }) => {
    await open(page, '/');
    const nav = await box(page.locator('nav:has(.nav-brand)'));
    expect((await box(page.locator('.hero-name-jp'))).top).toBeGreaterThanOrEqual(nav.bottom);
    const hero = await box(page.locator('#hero'));
    const actions = await box(page.locator('.hero-actions'));
    const available = await box(page.locator('.hero-available'));
    const cue = await box(page.locator('.hero-scroll'));
    expect(available.bottom).toBeLessThanOrEqual(hero.bottom);
    expect(cue.top).toBeGreaterThanOrEqual(actions.bottom);
    expect(cue.top).toBeGreaterThanOrEqual(available.bottom);
  });

  test('no menu do leque, idioma, tema e gráficos cabem na tela', async ({ page }) => {
    await open(page, '/certificates');
    await page.locator('.mobile-menu-btn').click();
    const menu = page.locator('[data-mobile-menu]');
    const language = menu.getByRole('button', { name: 'Mudar idioma para inglês' });
    await expect(language).toBeVisible();
    for (const control of [language, menu.getByRole('button', { name: 'Alternar dia/noite' }), menu.getByRole('radiogroup', { name: /Gráficos/ })]) {
      expect((await box(control)).bottom).toBeLessThanOrEqual(390);
    }
  });
});

test.describe('Celular estreito (320px)', () => {
  test.use({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });

  test('o nome cabe dentro da margem e a linha quebrada dos papéis não começa com o ponto', async ({ page }) => {
    await open(page, '/');
    // Conteúdo vai até 300px (margem de 20px)
    expect(await textRight(page.locator('.hero-name-given'))).toBeLessThanOrEqual(300);
    expect(await textRight(page.locator('.hero-name-family'))).toBeLessThanOrEqual(300);
    const roles = page.locator('.hero-role');
    const first = await box(roles.nth(0));
    const second = await box(roles.nth(1));
    // Em 320px o segundo papel desce para a linha de baixo, alinhado ao primeiro; o ponto dele
    // fica fora do recorte da esquerda
    expect(second.top).toBeGreaterThan(first.top);
    expect(Math.abs(second.left - first.left)).toBeLessThan(1);
    await expect(page.locator('.hero-roles')).toHaveCSS('clip-path', /inset/);
  });
});

test.describe('Navbar entre celular e desktop', () => {
  test('em 820px o menu fica no leque, sem espremer os links contra o nome', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1000 });
    await open(page, '/certificates');
    await expect(page.locator('.mobile-menu-btn')).toBeVisible();
    await expect(page.locator('.desktop-menu')).toBeHidden();
  });

  test('em 900px os links aparecem com folga do nome', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await open(page, '/certificates');
    const brand = await box(page.locator('.nav-brand'));
    const firstLink = await box(page.locator('.desktop-menu a').first());
    expect(firstLink.left - brand.right).toBeGreaterThan(40);
    // Nada passa da borda da tela
    const menu = await box(page.locator('.desktop-menu'));
    expect(menu.right).toBeLessThanOrEqual(900);
  });
});
