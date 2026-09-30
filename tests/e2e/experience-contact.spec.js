import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

async function scrollToId(page, id, offset = 0) {
  await page.evaluate(([i, o]) => {
    const el = document.getElementById(i);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + o);
  }, [id, offset]);
}

async function fillForm(page) {
  await page.getByLabel('Nome').fill('Visitante');
  await page.getByLabel('Email').fill('visitante@example.com');
  await page.getByLabel('Mensagem').fill('Olá, Raphael!');
}

// Quanto do traço sumi-e já foi desenhado (0–1), pelo dash que o DrawSVG aplica
const drawnFraction = (page) =>
  page.locator('.sumi-stroke').evaluate((path) => {
    const length = path.getTotalLength();
    const dash = getComputedStyle(path).strokeDasharray.split(/[ ,]+/).map(parseFloat);
    return dash.length >= 1 && !Number.isNaN(dash[0]) ? dash[0] / length : 1;
  });

test.describe('Experiência (歩)', () => {
  test('a pincelada sumi-e se desenha conforme o scroll', async ({ page }) => {
    await openHome(page);
    await scrollToId(page, 'experience', -400);
    await expect(page.locator('.sumi-stroke')).toHaveCount(1);
    const early = await drawnFraction(page);
    await scrollToId(page, 'experience', 900);
    await expect.poll(() => drawnFraction(page), { timeout: 5_000 }).toBeGreaterThan(early + 0.2);
  });

  test('as gotas de tinta aparecem nos três marcos', async ({ page }) => {
    await openHome(page);
    const drops = page.locator('.ink-drop');
    await expect(drops).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await drops.nth(i).evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await expect.poll(() => drops.nth(i).evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5_000 }).toBeGreaterThan(0.9);
    }
  });

  test('as três experiências continuam no DOM, com a IMACARDIOS', async ({ page }) => {
    await openHome(page);
    const section = page.locator('#experience');
    await expect(section).toContainText('Supermercado Mairinque');
    await expect(section).toContainText('Prefeitura de Mairinque');
    await expect(section).toContainText('IMACARDIOS');
  });
});

test.describe('Contato (縁)', () => {
  test('/contact redireciona para a seção de contato da home', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveURL(/\/#contato$/);
    await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator('#contato')).toBeInViewport({ ratio: 0.3 });
  });

  test('o link "Contato" da navbar leva até a seção', async ({ page }) => {
    await page.goto('/certificates');
    await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
    await page.getByRole('link', { name: 'Contato' }).first().click();
    await expect(page).toHaveURL(/\/#contato$/);
    await expect(page.locator('#contato')).toBeInViewport({ ratio: 0.3 });
  });

  test('enviar a mensagem solta uma lanterna e confirma', async ({ page }) => {
    let payload = null;
    await page.route('**/api/contact', async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await openHome(page);
    await scrollToId(page, 'contato');
    await fillForm(page);
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();

    await expect(page.getByText('Mensagem enviada com sucesso!')).toBeVisible();
    await expect(page.locator('[data-lantern-release]')).toHaveCount(1);
    await expect(page.locator('[data-lantern-release]')).toHaveCount(0, { timeout: 8_000 });
    expect(payload).toEqual({ name: 'Visitante', email: 'visitante@example.com', message: 'Olá, Raphael!' });
    await expect(page.getByLabel('Nome')).toHaveValue('');
  });

  test('erro do servidor avisa e não solta lanterna', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 500, body: '{}' }));
    await openHome(page);
    await scrollToId(page, 'contato');
    await fillForm(page);
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect(page.getByText('Erro ao enviar mensagem. Tente novamente.')).toBeVisible();
    await expect(page.locator('[data-lantern-release]')).toHaveCount(0);
    await expect(page.getByLabel('Mensagem')).toHaveValue('Olá, Raphael!');
  });

  test('falha de rede mostra erro de conexão', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.abort());
    await openHome(page);
    await scrollToId(page, 'contato');
    await fillForm(page);
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect(page.getByText('Erro de conexão. Verifique sua rede.')).toBeVisible();
  });

  test('campos obrigatórios impedem o envio vazio', async ({ page }) => {
    let called = false;
    await page.route('**/api/contact', (route) => {
      called = true;
      return route.fulfill({ status: 200, body: '{}' });
    });
    await openHome(page);
    await scrollToId(page, 'contato');
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect(page.getByLabel('Nome')).toBeFocused();
    expect(called).toBe(false);
  });
});

test('percorrer Experiência e Contato nos dois temas não gera erros', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  for (const theme of ['night', 'day']) {
    if (theme === 'day') {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByRole('button', { name: 'Alternar dia/noite' }).first().click();
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const id of ['experience', 'contato']) {
      await page.evaluate((sectionId) => document.getElementById(sectionId).scrollIntoView({ block: 'center' }), id);
      await expect(page.locator('html')).toHaveAttribute('data-section', id);
    }
    await expect(page.locator('html')).toHaveAttribute('data-season', 'winter');
  }
  expect(errors).toEqual([]);
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('pincelada já inteira e envio confirma sem animação da lanterna', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 200, body: '{}' }));
    await openHome(page);
    await scrollToId(page, 'experience', -400);
    expect(await drawnFraction(page)).toBeGreaterThan(0.99);
    await scrollToId(page, 'contato');
    await fillForm(page);
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect(page.getByText('Mensagem enviada com sucesso!')).toBeVisible();
  });
});
