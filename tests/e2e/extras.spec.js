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
  test('hero com ficha, links, stack em marquee e navegação para o próximo', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/projects/totem-autoatendimento');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Totem de Auto-atendimento');
    await expect(page.locator('.project-eyebrow')).toContainText('04 / 11');

    // Ficha: status e contagens vêm dos dados do projeto
    const meta = page.locator('.case-meta');
    await expect(meta).toContainText('No ar');
    await expect(meta).toContainText('07');

    await expect(page.getByRole('link', { name: /Acessar Projeto/ })).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('link', { name: /Ver no GitHub/ })).toHaveAttribute('rel', /noopener/);

    // Stack: lista acessível com cada tecnologia uma vez; a faixa visual fica fora da árvore
    const stack = page.getByRole('region', { name: 'Tecnologias Usadas' });
    await expect(stack.getByRole('listitem')).toHaveCount(7);
    await expect(page.locator('.case-marquee-track')).toHaveAttribute('aria-hidden', 'true');

    // Seções numeradas; com imagens, a galeria aparece
    await expect(page.getByRole('heading', { level: 2, name: 'Visão geral' })).toBeVisible();
    await expect(page.locator('.case-feature')).toHaveCount(7);
    await expect(page.locator('.project-gallery')).toHaveCount(1);

    const nav = page.getByRole('navigation', { name: 'Projeto' });
    await expect(nav.getByRole('link', { name: /Projeto anterior/ })).toHaveAttribute('href', '/projects/fit-ai-api');
    await nav.getByRole('link', { name: /Próximo projeto/ }).click();
    await expect(page).toHaveURL(/\/projects\/devflix-frontend$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('DevFlix');
    expect(errors).toEqual([]);
  });

  test('sem imagens não mostra galeria; o primeiro não tem "anterior"', async ({ page }) => {
    await page.goto('/projects/imacardios');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('IMACARDIOS');
    await expect(page.locator('.project-gallery')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Projeto anterior/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Próximo projeto/ })).toHaveAttribute('href', '/projects/fit-ai-frontend');
    // Sem repositório público: só o botão de acesso
    await expect(page.getByRole('link', { name: /Ver no GitHub/ })).toHaveCount(0);
  });

  test('o último projeto fecha o ciclo voltando ao primeiro', async ({ page }) => {
    await page.goto('/projects/star-wars-catalog');
    await expect(page.getByRole('link', { name: /Próximo projeto/ })).toHaveAttribute('href', '/projects/imacardios');
  });

  test('o título fica inteiro (SplitText não quebra o texto do heading)', async ({ page }) => {
    await page.goto('/projects/fit-ai-api');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('FIT.AI: API');
  });

  test('a linha de leitura enche conforme o scroll', async ({ page }) => {
    await page.goto('/projects/imacardios');
    await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
    const fill = () => page.locator('.case-progress span').evaluate((el) => el.getBoundingClientRect().height);
    const start = await fill();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(fill, { timeout: 5_000 }).toBeGreaterThan(start + 200);
  });

  test.describe('em celular', () => {
    const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
    test.use(pixel);

    test('sem rolagem horizontal e sem os numerais grandes', async ({ page }) => {
      await page.goto('/projects/imacardios');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.case-kanji')).toBeHidden();
      await expect(page.locator('.case-next-kanji')).toBeHidden();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  });

  test.describe('com prefers-reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('tudo visível de cara, sem marquee andando', async ({ page }) => {
      await page.goto('/projects/totem-autoatendimento');
      await expect(page.locator('.case-lead')).toHaveCSS('opacity', '1');
      const x = () => page.locator('.case-marquee-track').evaluate((el) => getComputedStyle(el).transform);
      const before = await x();
      await page.waitForTimeout(800);
      expect(await x()).toBe(before);
    });
  });
});

test.describe('Formulário de contato (縁)', () => {
  test('a mensagem vai com as quebras de linha e sem o campo isca', async ({ page }) => {
    let payload = null;
    await page.route('**/api/contact', async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await openHome(page);
    await scrollToContact(page);
    await page.getByLabel('Nome').fill('Ana');
    await page.getByLabel('Email').fill('ana@example.com');
    await page.getByLabel('Mensagem').fill('Linha 1\nLinha 2');
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect.poll(() => payload).not.toBeNull();
    expect(payload).toEqual({ name: 'Ana', email: 'ana@example.com', message: 'Linha 1\nLinha 2' });
  });

  test('o campo isca fica fora do teclado e dos leitores de tela', async ({ page }) => {
    await openHome(page);
    const bait = page.locator('#contact-company');
    await expect(bait).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('.contact-honeypot')).toHaveAttribute('aria-hidden', 'true');
    await expect(bait).not.toBeInViewport();
  });

  test('muitos envios avisam para esperar (429)', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 429, body: '{}' }));
    await openHome(page);
    await scrollToContact(page);
    await page.getByLabel('Nome').fill('Ana');
    await page.getByLabel('Email').fill('ana@example.com');
    await page.getByLabel('Mensagem').fill('oi');
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect(page.getByText(/Muitas mensagens em pouco tempo/)).toBeVisible();
    await expect(page.locator('[data-lantern-release]')).toHaveCount(0);
  });

  test('envio fora do ar (503) oferece o e-mail direto', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill({ status: 503, body: '{}' }));
    await openHome(page);
    await scrollToContact(page);
    await page.getByLabel('Nome').fill('Ana');
    await page.getByLabel('Email').fill('ana@example.com');
    await page.getByLabel('Mensagem').fill('oi');
    await page.getByRole('button', { name: 'Enviar Mensagem' }).click();
    await expect(page.getByText(/raphaelokuyama123@gmail\.com diretamente|Escreva direto para raphaelokuyama123@gmail\.com/)).toBeVisible();
    // A mensagem não se perde: continua no formulário
    await expect(page.getByLabel('Mensagem')).toHaveValue('oi');
  });

  test('a API recusa e-mail inválido e mensagem vazia (400)', async ({ request }) => {
    const bad = await request.post('/api/contact', { data: { name: 'Ana', email: 'nao-e-email', message: 'oi' } });
    expect(bad.status()).toBe(400);
    expect((await bad.json()).code).toBe('email');
    const empty = await request.post('/api/contact', { data: { name: 'Ana', email: 'ana@example.com', message: '   ' } });
    expect(empty.status()).toBe(400);
  });

  test('a API finge sucesso para robôs, sem tentar enviar', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { name: 'Bot', email: 'bot@example.com', message: 'spam', company: 'ACME' },
    });
    expect(res.status()).toBe(200);
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
