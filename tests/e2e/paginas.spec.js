import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

const loader = (page) => page.locator('[data-loader="enso"]');

async function open(page, url) {
  await page.goto(url);
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
}

test.describe('Certificados: graduação, datas e visualizador', () => {
  test('a graduação abre a página, com o selo 卒業見込 enquanto a conclusão é prevista', async ({ page }) => {
    await open(page, '/certificates');
    const degree = page.locator('.cert-degree[data-lang="pt"]');
    await expect(degree).toBeVisible();
    await expect(degree.getByRole('heading', { name: 'Engenharia de Computação' })).toBeVisible();
    await expect(degree).toContainText('Conclusão prevista: Dez 2026');
    await expect(degree.locator('.cert-degree-stamp')).toHaveText('卒業見込');
    // Antes dos filtros e dos grupos
    const degreeBox = await degree.boundingBox();
    const filtersBox = await page.locator('.cert-filters').boundingBox();
    expect(degreeBox.y).toBeLessThan(filtersBox.y);
  });

  test('cada certificado traz mês e carga horária, do mais recente para o mais antigo', async ({ page }) => {
    await open(page, '/certificates');
    const full = page.locator('.cert-board > [data-lang="pt"] .cert-group[data-area="full"] .cert-item');
    await expect(full.first()).toContainText('Bootcamp Self Checkout');
    await expect(full.first().locator('.cert-inst')).toContainText('Full Stack Club · Mar 2026 · 18h');
    const trilha = page.locator('.cert-board > [data-lang="pt"] .cert-item', { hasText: 'Trilha JavaScript' });
    await expect(trilha.locator('.cert-inst')).toContainText('6 módulos · Nov 2024 – Mai 2025 · 70h');
  });

  test('"Ver certificado" abre o 賞状 na página; setas e Esc navegam e fecham', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await open(page, '/certificates');
    await page.getByRole('link', { name: 'Ver certificado: Curso de React' }).click();
    await expect(page.getByRole('dialog', { name: 'Curso de React' })).toBeVisible();
    // O nome do diálogo acompanha o certificado aberto: daqui em diante, pelo diálogo aberto
    const viewer = page.locator('.cert-viewer[open]');
    await expect(viewer.getByRole('img', { name: 'Certificado: Curso de React' })).toBeVisible();
    await expect(viewer).toContainText('OneBitCode · emitido em Jul 2025 · 22h');
    // A página continua no lugar (não abriu outra aba nem navegou)
    await expect(page).toHaveURL(/\/certificates$/);
    const title = viewer.locator('.cert-viewer-title');
    await page.keyboard.press('ArrowRight');
    await expect(title).not.toHaveText('Curso de React');
    await viewer.getByRole('button', { name: 'Certificado anterior' }).click();
    await expect(title).toHaveText('Curso de React');
    await page.keyboard.press('Escape');
    await expect(page.locator('.cert-viewer')).not.toHaveAttribute('open', '');
    expect(errors).toEqual([]);
  });

  test('o módulo da trilha abre o certificado dele, e o filtro limita o que as setas percorrem', async ({ page }) => {
    await open(page, '/certificates');
    await page.getByRole('button', { name: /Fundamentos/ }).click();
    await page.getByRole('link', { name: 'Ver certificado: Trilha JavaScript, III' }).click();
    const viewer = page.locator('.cert-viewer[open]');
    await expect(viewer.locator('.cert-viewer-title')).toHaveText('Trilha JavaScript · III');
    // Fundamentos: 6 módulos + TypeScript + Git
    await expect(viewer.locator('.cert-viewer-count')).toHaveText(/\/ 8$/);
  });

  test.describe('no celular', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('o visualizador cabe na tela', async ({ page }) => {
      await open(page, '/certificates');
      await page.getByRole('link', { name: 'Ver certificado: Git e GitHub' }).click();
      const frame = page.locator('.cert-viewer[open] .cert-viewer-frame');
      await expect(frame).toBeVisible();
      const box = await frame.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    });
  });
});

test.describe('Página de projeto: capa, ficha e o caso', () => {
  test('o print aparece logo depois do topo, numa janela com o endereço do site', async ({ page }) => {
    await open(page, '/projects/saeko-artes');
    const cover = page.locator('.case-cover.is-site');
    await expect(cover).toBeAttached();
    await expect(cover.locator('.case-cover-address')).toHaveText('catalago-amigurumis.vercel.app');
    // Antes da faixa da stack e das seções
    const coverTop = await cover.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const marqueeTop = await page.locator('.case-marquee').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    expect(coverTop).toBeLessThan(marqueeTop);
  });

  test('a ficha mostra papel, contexto, período e status', async ({ page }) => {
    await open(page, '/projects/imacardios');
    const meta = page.locator('.case-meta');
    await expect(meta.locator('dt')).toHaveText(['Papel', 'Contexto', 'Período', 'Status', 'Role para ler']);
    await expect(meta.locator('dd').first()).toHaveText('Full-stack, em dupla');
    await expect(meta).toContainText('Mai 2025 – atual');
    await expect(page.locator('.case-cover.is-ecg')).toBeAttached();
  });

  test('o caso da Saeko: desafio, decisões e resultado', async ({ page }) => {
    await open(page, '/projects/saeko-artes');
    const study = page.locator('.case-study');
    await expect(study.getByRole('heading', { name: 'O caso' })).toBeAttached();
    await expect(study.locator('.case-study-list li')).toHaveCount(4);
    await expect(study.locator('.case-study-result')).toContainText('28 peças');
  });

  test('celulares lado a lado nos apps, rotas nas APIs sem tela', async ({ page }) => {
    await open(page, '/projects/fit-ai-frontend');
    await expect(page.locator('.case-cover.is-phones .case-cover-phone')).toHaveCount(3);
    await open(page, '/projects/api-library');
    const routes = page.locator('.case-cover.is-api .case-cover-routes li');
    await expect(routes).toHaveCount(7);
    await expect(routes.nth(5)).toContainText('/api/loans');
    await expect(routes.nth(5).getByText('pede login')).toBeAttached();
  });

  test('"Voltar" de quem chegou direto leva à lista de projetos, não para fora do site', async ({ page }) => {
    await open(page, '/projects/glow-laser');
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });

  test('"Voltar" depois de navegar pelo site volta para a página anterior', async ({ page }) => {
    await open(page, '/projects');
    await page.locator('.pj-card', { hasText: 'GLOW LASER' }).getByRole('link').first().click();
    await expect(page).toHaveURL(/\/projects\/glow-laser$/);
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });
});
