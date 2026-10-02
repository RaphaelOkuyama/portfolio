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
  await page.getByLabel('E-mail', { exact: true }).fill('visitante@example.com');
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

  test('as gotas de tinta aparecem nos quatro marcos (três cargos e a formação)', async ({ page }) => {
    await openHome(page);
    const drops = page.locator('#experience .ink-drop');
    await expect(drops).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await drops.nth(i).evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await expect.poll(() => drops.nth(i).evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5_000 }).toBeGreaterThan(0.9);
    }
  });

  test('do mais recente ao mais antigo, terminando na formação', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('#experience .exp-company')).toHaveText([
      'IMACARDIOS', 'Prefeitura de Mairinque', 'Supermercado Mairinque', 'FACENS',
    ]);
  });

  test('cada cargo mostra período, duração, conquistas e tags; os atuais aparecem em paralelo', async ({ page }) => {
    await openHome(page);
    const cards = page.locator('#experience .exp-card');
    const imacardios = cards.nth(0);
    await expect(imacardios.locator('.exp-period')).toContainText('Mai 2025 - Atual');
    await expect(imacardios.locator('.exp-duration')).toContainText(/\d+ (ano|mes)/);
    await expect(imacardios.locator('.exp-badge')).toHaveText(['Freelance', 'em paralelo']);
    await expect(imacardios.locator('.exp-value')).toHaveText(['42+', '2.000+', '2FA']);
    await expect(imacardios.locator('.exp-tags li')).toContainText(['NestJS']);
    await expect(cards.nth(1).locator('.exp-badge')).toHaveText(['Estágio', 'em paralelo']);
    // O antigo terminou quando o estágio começou: não é paralelo
    await expect(cards.nth(2).locator('.exp-badge')).toHaveCount(0);
    await expect(cards.nth(2).locator('.exp-period')).toContainText('Abr 2022 - Fev 2025 · 2 anos e 11 meses');
    await expect(cards.nth(3)).toContainText('Engenharia de Computação');
  });

  test('a IMACARDIOS leva à página do projeto', async ({ page }) => {
    await openHome(page);
    await page.locator('#experience').getByRole('link', { name: 'Ver o projeto' }).click();
    await expect(page).toHaveURL(/\/projects\/imacardios$/);
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
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();

    await expect(page.getByText('Mensagem enviada com sucesso!')).toBeVisible();
    await expect(page.locator('[data-lantern-release]')).toHaveCount(1);
    await expect(page.locator('[data-lantern-release]')).toHaveCount(0, { timeout: 8_000 });
    expect(payload).toEqual({ name: 'Visitante', email: 'visitante@example.com', message: 'Olá, Raphael!' });
    // A carta vira o agradecimento, com o foco nele; dá para escrever outra
    const sent = page.locator('.contact-sent');
    await expect(sent).toContainText('Sua lanterna já está no rio, Visitante.');
    await expect(sent).toBeFocused();
    await page.getByRole('button', { name: 'Enviar outra mensagem' }).click();
    await expect(page.getByLabel('Nome')).toHaveValue('');
    await expect(page.getByLabel('Nome')).toBeFocused();
  });

  test('o carimbo 縁 marca a carta antes da lanterna', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 200, body: '{}' }));
    await openHome(page);
    await scrollToId(page, 'contato');
    await fillForm(page);
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.locator('[data-seal]')).toBeVisible();
  });

  test('erro do servidor avisa e não solta lanterna', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 500, body: '{}' }));
    await openHome(page);
    await scrollToId(page, 'contato');
    await fillForm(page);
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.getByText('Erro ao enviar mensagem. Tente novamente.')).toBeVisible();
    await expect(page.locator('[data-lantern-release]')).toHaveCount(0);
    await expect(page.getByLabel('Mensagem')).toHaveValue('Olá, Raphael!');
  });

  test('falha de rede mostra erro de conexão', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.abort());
    await openHome(page);
    await scrollToId(page, 'contato');
    await fillForm(page);
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
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
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.getByLabel('Nome')).toBeFocused();
    // Avisos em português embaixo de cada campo (nada do balão do navegador em inglês)
    await expect(page.locator('#contact-name-error')).toHaveText('Diga como posso te chamar.');
    await expect(page.locator('#contact-email-error')).toHaveText('Informe seu e-mail para eu responder.');
    await expect(page.locator('#contact-message-error')).toHaveText('Escreva sua mensagem.');
    await expect(page.getByLabel('Nome')).toHaveAttribute('aria-invalid', 'true');
    expect(called).toBe(false);
    // Corrigir o campo apaga o aviso dele
    await page.getByLabel('Nome').fill('Ana');
    await expect(page.locator('#contact-name-error')).toHaveText('');
  });

  test('e-mail inválido avisa ao sair do campo e o contador acompanha a mensagem', async ({ page }) => {
    await openHome(page);
    await scrollToId(page, 'contato');
    await page.getByLabel('E-mail', { exact: true }).fill('abc');
    await page.getByLabel('Mensagem').focus();
    await expect(page.locator('#contact-email-error')).toHaveText('Esse e-mail não parece válido.');
    await page.getByLabel('Mensagem').fill('Olá!');
    await expect(page.locator('.contact-counter')).toHaveText('4 / 5.000');
  });

  test('disponibilidade, local e botão de copiar o e-mail', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openHome(page);
    await scrollToId(page, 'contato');
    const section = page.locator('#contato');
    await expect(section.locator('.contact-availability li')).toHaveText(['CLT', 'PJ', 'Freelance']);
    await expect(section).toContainText('São Paulo, Brasil');
    await expect(section).toContainText('Ao enviar, sua mensagem desce o rio numa lanterna.');
    await section.getByRole('button', { name: 'Copiar e-mail' }).click();
    await expect(page.getByText('E-mail copiado!').first()).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('raphaelokuyama123@gmail.com');
  });
});

test.describe('Contato no celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('a carta vem logo depois do título, antes dos canais', async ({ page }) => {
    await openHome(page);
    const intro = await page.locator('.contact-intro').boundingBox();
    const letter = await page.locator('.contact-letter').boundingBox();
    const direct = await page.locator('.contact-direct').boundingBox();
    expect(letter.y).toBeGreaterThan(intro.y);
    expect(direct.y).toBeGreaterThan(letter.y);
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
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.getByText('Mensagem enviada com sucesso!')).toBeVisible();
  });
});
