import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

// Fases C e D do redesign: fotos dos repositórios, IMACARDIOS, numerais daiji, 丁石, papel e
// lavado de nanquim, bastidores e o cursor com palavra
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('oku-visited', '1'));
});

async function toProjects(page) {
  await page.evaluate(() => {
    const s = document.getElementById('projects');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 40);
  });
  await page.waitForTimeout(800);
}

test('cada seção tem o seu 丁石 a caminho do 奥の院', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-station="about"] .choishi-mark')).toHaveText('四丁');
  await expect(page.locator('[data-station="stack"] .choishi-mark')).toHaveText('三丁');
  await expect(page.locator('[data-station="projects"] .choishi-mark')).toHaveText('二丁');
  await expect(page.locator('[data-station="experience"] .choishi-mark')).toHaveText('一丁');
  await expect(page.locator('[data-station="contato"] .choishi-mark')).toHaveText('奥の院');
  await expect(page.locator('[data-station="about"] .choishi-left')).toHaveText('Faltam quatro chō para o santuário');
});

test('o rolo numera em daiji, em sequência, e mostra o que existe de cada projeto', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/');
  await toProjects(page);
  await expect(page.locator('.emaki-number')).toHaveText(['壱', '弐', '参', '肆', '伍', '陸', '全']);
  await expect(page.locator('[data-project="imacardios"] .emaki-media.is-ecg svg')).toHaveCount(1);
  await expect(page.locator('[data-project="saeko-artes"] .emaki-media.is-products .emaki-shot')).toHaveCount(3);
  await expect(page.locator('[data-project="arca-construtora"] .emaki-shot')).toHaveCount(1);
  await expect(page.locator('[data-project="fit-ai-frontend"] .emaki-media.is-phones .emaki-shot')).toHaveCount(3);
  await expect(page.locator('[data-project="fit-ai-frontend"] .emaki-origin')).toHaveText('Bootcamp');
  await expect(page.locator('[data-project="portfolio-okuyama"] .emaki-media')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('à noite o rolo e a carta do contato são papel claro com tinta escura', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('.emaki-panel').first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(230, 222, 206)');
  expect(await page.locator('.contact-letter').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(230, 222, 206)');
  await expect(page.locator('.exp-period').first()).toHaveCSS('text-transform', 'none');
});

test('o cursor vira um disco com "Abrir" sobre os painéis do rolo', async ({ page }) => {
  await page.goto('/');
  await toProjects(page);
  // O rolo termina de desenrolar (scrub) antes de o painel receber o ponteiro
  await page.waitForTimeout(1500);
  await page.locator('.emaki-panel').first().hover();
  await expect(page.locator('[data-cursor="ink"]')).toHaveAttribute('data-hover', 'label');
  await expect(page.locator('[data-cursor="ink"] .cursor-label')).toHaveText('Abrir');
});

test('IMACARDIOS conta o caso com o diagrama do isolamento em duas camadas', async ({ page }) => {
  await page.goto('/projects/imacardios');
  const study = page.locator('.case-study');
  await expect(study.getByRole('heading', { name: 'O caso' })).toBeVisible();
  await expect(study.getByRole('img', { name: /isola os dados por clínica/ })).toBeAttached();
  await expect(study.locator('.case-study-label')).toHaveText(['Desafio', 'O que decidi', 'Resultado']);
  await expect(page.locator('.case-num')).toHaveText(['01', '02', '03']);
});

test('os prints do GitHub aparecem na galeria e nos cartões de /projects', async ({ page }) => {
  await page.goto('/projects/arca-construtora');
  await expect(page.locator('.project-gallery img').first()).toHaveAttribute('alt', 'Landing page da ARCA, tela 1');
  await page.goto('/projects');
  await expect(page.locator('.pj-card', { hasText: 'GLOW LASER' }).first().locator('.pj-thumb img')).toHaveCount(1);
  await expect(page.locator('.pj-card.is-featured .pj-thumb.is-ecg').first()).toBeAttached();
});

test('bastidores: a página do making-of, ligada no rodapé, com os créditos', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/bastidores');
  await expect(page.getByRole('heading', { level: 1, name: 'Bastidores' })).toBeVisible();
  await expect(page.locator('.making-section')).toHaveCount(5);
  await expect(page.locator('.making-credits')).toContainText('Poly Haven');
  await expect(page.locator('footer').getByRole('link', { name: 'Bastidores' })).toHaveAttribute('href', '/bastidores');
  await expect(page.locator('footer .sf-credit').getByRole('link', { name: 'Poly Haven' })).toBeAttached();
  expect(errors).toEqual([]);
});

test('galeria: a troca termina com uma foto só, mesmo com cliques rápidos, e aceita o teclado', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/projects/saeko-artes');
  const gallery = page.locator('.project-gallery');
  await gallery.scrollIntoViewIfNeeded();
  const count = gallery.locator('.pic-count');
  await expect(count).toHaveText('1 / 13');
  // A vizinha já está montada antes do clique: a troca não espera a foto carregar
  await expect(gallery.locator('.pic-slide').nth(1).locator('img')).toHaveCount(1);
  const next = gallery.getByRole('button', { name: 'Próxima foto' });
  for (let i = 0; i < 4; i++) await next.click();
  await expect(count).toHaveText('5 / 13');
  await expect.poll(() => gallery.locator('.pic-slide').evaluateAll((slides) => (
    slides.filter((s) => getComputedStyle(s).visibility === 'visible').length
  ))).toBe(1);
  await expect(gallery.locator('.pic-slide.is-current img')).toHaveAttribute('alt', 'Catálogo da Saeko Artes, tela 5');
  await gallery.getByRole('button', { name: 'Foto anterior' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(count).toHaveText('4 / 13');
  // As peças aparecem inteiras sobre o branco da foto
  await gallery.getByRole('button', { name: 'Ir para a foto 7' }).click();
  await expect(gallery.locator('.pic-slide.is-current')).toHaveClass(/is-contain/);
  await expect(gallery.locator('.pic-slide.is-current img')).toHaveCSS('object-fit', 'contain');
  expect(errors).toEqual([]);
});

test('as três peças da Saeko cabem na folha do painel do rolo', async ({ page }) => {
  await page.goto('/');
  await toProjects(page);
  const inside = await page.locator('[data-project="saeko-artes"] .emaki-media.is-products').evaluate((media) => {
    const box = media.getBoundingClientRect();
    return [...media.querySelectorAll('.emaki-shot')].every((shot) => {
      const r = shot.getBoundingClientRect();
      return r.left >= box.left - 1 && r.right <= box.right + 1;
    });
  });
  expect(inside).toBe(true);
});
