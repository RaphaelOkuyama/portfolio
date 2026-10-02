import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

const loader = (page) => page.locator('[data-loader="enso"]');

async function openHome(page) {
  await page.goto('/');
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
}

async function scrollToProjects(page) {
  await page.evaluate(() => {
    const s = document.getElementById('projects');
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 40);
  });
  await page.waitForTimeout(800);
}

test.describe('Loader só na primeira visita', () => {
  test('quem volta ao site não vê o ensō de novo', async ({ page }) => {
    await openHome(page);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-visited', '');
    // Escondido desde o primeiro paint e removido logo depois
    await expect(loader(page)).toBeHidden();
    await expect(loader(page)).toHaveCount(0, { timeout: 2_000 });
    await expect(page.locator('.hero-scroll')).toBeVisible({ timeout: 5_000 });
    // A página rola normalmente (sem a trava do loader)
    await expect(page.locator('html')).not.toHaveClass(/is-loading/);
  });

  test('primeira visita ainda mostra o ensō', async ({ page }) => {
    await page.goto('/');
    await expect(loader(page)).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-visited', '');
  });
});

test.describe('Painel do emakimono vira o topo do projeto', () => {
  test('numeral e título voam até o hero e o painel some sem deixar rastro', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await openHome(page);
    await scrollToProjects(page);
    await page.evaluate(() => {
      window.__morph = [];
      new MutationObserver(() => {
        const title = document.querySelector('.emaki-morph-title');
        if (title) window.__morph.push({ path: location.pathname, text: title.textContent });
      }).observe(document.body, { childList: true, subtree: true, attributes: true });
    });
    const panel = page.locator('.emaki-panel').nth(1);
    const title = await panel.locator('.emaki-title').textContent();
    await panel.click();
    await expect(page).toHaveURL(/\/projects\/saeko-artes$/);
    const morph = await page.evaluate(() => window.__morph);
    // O título em voo existiu na home e continuou na página do projeto (sem corte)
    expect(morph.some((m) => m.path === '/' && m.text === title)).toBe(true);
    expect(morph.some((m) => m.path === '/projects/saeko-artes')).toBe(true);
    await expect(page.locator('.emaki-morph')).toHaveCount(0, { timeout: 5_000 });
    // Pousou: o título real está inteiro (sem SplitText) e visível
    await expect(page.locator('.case-title')).toHaveText(title);
    await expect(page.locator('.case-title')).toHaveCSS('opacity', '1');
    await expect(page.locator('.case-title .case-word')).toHaveCount(0);
    await expect(page.locator('.case-kanji')).toHaveCSS('opacity', '0.55');
    expect(errors).toEqual([]);
  });

  test('abrir o projeto direto mantém a entrada letra a letra', async ({ page }) => {
    await page.goto('/projects/saeko-artes');
    await expect(page.locator('.case-title .case-word').first()).toBeAttached();
    await expect(page.locator('.emaki-morph')).toHaveCount(0);
  });

  test('ctrl+clique abre em outra aba sem animar', async ({ page, context }) => {
    await openHome(page);
    await scrollToProjects(page);
    const popup = context.waitForEvent('page');
    await page.locator('.emaki-panel').first().click({ modifiers: ['Control'] });
    await popup;
    await expect(page.locator('.emaki-morph')).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Fundo pintado sem WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
        if (/webgl/i.test(type)) return null;
        return original.call(this, type, ...args);
      };
    });
  });

  test('tem névoa, cedros e o rio, e acompanha o tema', async ({ page }) => {
    await openHome(page);
    const backdrop = page.locator('[data-scene="fallback"] .static-backdrop');
    await expect(backdrop).toBeVisible();
    await expect(backdrop.locator('.backdrop-mist')).toHaveCount(2);
    await expect(backdrop.locator('[data-trees="near"]')).toHaveAttribute('d', /M/);
    await expect(backdrop.locator('[data-trees="mid"]')).toHaveAttribute('d', /M/);
    await expect(backdrop.locator('[data-river]')).toHaveAttribute('d', /Z$/);
    const nightSky = await backdrop.locator('#bd-sky stop').first().getAttribute('stop-color');
    await page.getByRole('button', { name: 'Alternar dia/noite' }).first().click();
    await expect(backdrop.locator('#bd-sky stop').first()).not.toHaveAttribute('stop-color', nightSky);
  });

  test('as cores seguem a estação conforme rola', async ({ page }) => {
    await openHome(page);
    const backdrop = page.locator('[data-scene="fallback"] .static-backdrop');
    await expect(backdrop).toHaveAttribute('data-season-mix', '0');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(backdrop).not.toHaveAttribute('data-season-mix', '0', { timeout: 5_000 });
  });
});

test.describe('Compartilhamento e SEO', () => {
  test('cada projeto tem card próprio de compartilhamento', async ({ page, request }) => {
    await page.goto('/projects/react-kanban');
    await expect(page).toHaveTitle(/React Kanban/);
    const og = page.locator('meta[property="og:image"]');
    const url = new URL(await og.getAttribute('content'));
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'React Kanban');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    const image = await request.get(url.pathname + url.search);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toBe('image/png');
    expect((await image.body()).length).toBeGreaterThan(10_000);
  });

  test('sitemap lista as páginas e todos os projetos; robots aponta para ele', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    for (const slug of ['imacardios', 'saeko-artes', 'react-kanban', 'star-wars-catalog']) {
      expect(sitemap).toContain(`/projects/${slug}<`);
    }
    expect(sitemap).toContain('/certificates<');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toMatch(/Sitemap: https:\/\/.+\/sitemap\.xml/);
  });

  test('a home tem dados estruturados de Pessoa', async ({ page }) => {
    await page.goto('/');
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const person = JSON.parse(raw);
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe('Raphael Nobuyuki Haga Okuyama');
    expect(person.alternateName).toContain('奥山');
    expect(person.sameAs).toEqual(expect.arrayContaining([
      expect.stringContaining('github.com'),
      expect.stringContaining('linkedin.com'),
    ]));
  });

  test('slug inexistente responde 404', async ({ request }) => {
    const res = await request.get('/projects/nao-existe');
    expect(res.status()).toBe(404);
  });
});

test.describe('Hero renderizado no servidor', () => {
  test('o HTML já traz nome e funções, e o idioma troca sem recarregar', async ({ page, request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('Raphael Nobuyuki Haga Okuyama');
    expect(html).toContain('Desenvolvedor Full-Stack');
    await openHome(page);
    const chip = page.locator('.hero-role').first();
    await expect(chip.getByText('Desenvolvedor Full-Stack')).toBeVisible();
    await expect(chip.getByText('Full-Stack Developer')).toBeHidden();
    await page.getByRole('button', { name: 'Mudar idioma para inglês' }).first().click();
    await expect(chip.getByText('Full-Stack Developer')).toBeVisible();
    await expect(chip.getByText('Desenvolvedor Full-Stack')).toBeHidden();
  });
});
