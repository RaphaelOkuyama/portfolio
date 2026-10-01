import { test, expect, devices } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

// Rola até uma fração do trecho fixado (0 = início do pin, 1 = fim)
async function scrollProjects(page, fraction) {
  await page.evaluate((f) => {
    const section = document.getElementById('projects');
    const top = section.getBoundingClientRect().top + window.scrollY;
    const pinLength = section.offsetHeight - window.innerHeight;
    window.scrollTo(0, top + Math.max(0, pinLength) * f);
  }, fraction);
}

const trackX = (page) =>
  page.locator('.emaki-track').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);

test('o emakimono lista os projetos com o IMACARDIOS primeiro', async ({ page }) => {
  await openHome(page);
  const panels = page.locator('.emaki-panel');
  await expect(panels).toHaveCount(11);
  await expect(panels.first()).toContainText('IMACARDIOS');
  await expect(panels.first()).toHaveAttribute('href', '/projects/imacardios');
});

test('o scroll vertical desenrola o rolo na horizontal com a seção fixada', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 0.05);
  await page.waitForTimeout(800);
  const headerStart = await page.locator('.emaki-header').boundingBox();
  const xStart = await trackX(page);

  await scrollProjects(page, 0.7);
  await expect.poll(() => trackX(page), { timeout: 5_000 }).toBeLessThan(xStart - 300);
  const headerLater = await page.locator('.emaki-header').boundingBox();
  // Seção fixada: o título não sai do lugar enquanto o rolo anda
  expect(Math.abs(headerLater.y - headerStart.y)).toBeLessThan(4);
});

test('o conteúdo dos painéis surge ao entrar e o último fica completo no fim', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 1);
  const last = page.locator('.emaki-panel').last();
  // Nenhum filho do último painel fica apagado quando o rolo chega ao fim
  await expect
    .poll(() => last.evaluate((el) => Math.min(...[...el.children].map((c) => Number(getComputedStyle(c).opacity)))), { timeout: 5_000 })
    .toBeGreaterThan(0.95);
});

test('focar um painel fora da tela rola o rolo até ele', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 0);
  const target = page.locator('.emaki-panel').nth(7);
  await target.focus();
  await expect
    .poll(async () => {
      const box = await target.boundingBox();
      const width = page.viewportSize().width;
      return box.x >= 0 && box.x + box.width <= width;
    }, { timeout: 5_000 })
    .toBe(true);
});

test('clicar num painel expande e abre o projeto', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 0.02);
  await page.waitForTimeout(800);
  // Registra a expansão dentro da página: ela pode terminar antes do click() voltar
  await page.evaluate(() => {
    window.__expanded = false;
    new MutationObserver(() => {
      if (document.querySelector('.emaki-expand')) window.__expanded = true;
    }).observe(document.body, { childList: true });
  });
  await page.locator('.emaki-panel').first().click();
  await expect(page).toHaveURL(/\/projects\/imacardios$/);
  expect(await page.evaluate(() => window.__expanded)).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('IMACARDIOS');
  await expect(page.locator('.emaki-expand')).toHaveCount(0, { timeout: 5_000 });
});

test('o link "Ver todos os projetos" leva para a lista', async ({ page }) => {
  await openHome(page);
  await scrollProjects(page, 1);
  await page.getByRole('link', { name: 'Ver todos os projetos' }).click();
  await expect(page).toHaveURL(/\/projects$/);
});

test('percorrer o emakimono nos dois temas não gera erros', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  for (const theme of ['night', 'day']) {
    if (theme === 'day') {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByRole('button', { name: 'Alternar dia/noite' }).first().click();
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const f of [0, 0.5, 1]) {
      await scrollProjects(page, f);
      await expect(page.locator('html')).toHaveAttribute('data-section', 'projects');
    }
  }
  expect(errors).toEqual([]);
});

test.describe('em celular', () => {
  const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
  test.use(pixel);

  test('o rolo é arrastável e a seção não fica fixada', async ({ page }) => {
    await openHome(page);
    await page.evaluate(() => document.getElementById('projects').scrollIntoView());
    const sectionHeight = await page.locator('#projects').evaluate((el) => el.offsetHeight);
    // Sem pin: a seção tem só a altura do conteúdo
    expect(sectionHeight).toBeLessThan(page.viewportSize().height * 1.6);
    // Espera o rolo terminar de abrir: a parte ainda recortada não recebe o toque
    await expect
      .poll(() => page.locator('.emaki-viewport').evaluate((el) => getComputedStyle(el).clipPath), { timeout: 6_000 })
      .toBe('none');

    const box = await page.locator('.emaki-track').boundingBox();
    const before = await trackX(page);
    await page.mouse.move(box.x + 300, box.y + 120);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + 120, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => trackX(page), { timeout: 5_000 }).toBeLessThan(before - 100);
  });
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('os projetos viram uma grade estática e o clique abre direto', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.emaki-track')).toHaveCSS('display', 'grid');
    expect(await trackX(page)).toBe(0);
    const first = page.locator('.emaki-panel').first();
    await first.scrollIntoViewIfNeeded();
    await first.click();
    await expect(page).toHaveURL(/\/projects\/imacardios$/);
    await expect(page.locator('.emaki-expand')).toHaveCount(0);
  });
});

// Largura visível do rolo: o clip-path recorta a direita enquanto o papel está enrolado
const openWidth = (page) =>
  page.locator('.emaki-viewport').evaluate((el) => {
    const clip = getComputedStyle(el).clipPath;
    const m = clip.match(/inset\([^)]*?(-?[\d.]+)px[^)]*?(-?[\d.]+)px/);
    if (!m || clip === 'none') return el.clientWidth;
    return el.clientWidth - parseFloat(m[2]);
  });

test.describe('Emakimono desenrolando', () => {
  test('o papel abre da esquerda para a direita conforme a seção sobe', async ({ page }) => {
    await openHome(page);
    const pinStart = await page.evaluate(() => document.querySelector('.emaki-pin').getBoundingClientRect().top + window.scrollY - 72);

    // Bem antes: quase todo enrolado, com o cilindro perto do rolo de madeira
    await page.evaluate((y) => window.scrollTo(0, y), pinStart - 700);
    await page.waitForTimeout(900);
    const closed = await openWidth(page);
    const width = await page.locator('.emaki-viewport').evaluate((el) => el.clientWidth);
    expect(closed).toBeLessThan(width * 0.35);

    // No meio do caminho: parcialmente aberto, e o cilindro acompanha a borda
    await page.evaluate((y) => window.scrollTo(0, y), pinStart - 330);
    await expect.poll(() => openWidth(page), { timeout: 5_000 }).toBeGreaterThan(closed + 100);
    const roller = await page.locator('.emaki-roller').boundingBox();
    const edge = await openWidth(page);
    expect(Math.abs(roller.x - edge)).toBeLessThan(40);

    // Quando a seção fixa, o rolo está todo aberto
    await page.evaluate((y) => window.scrollTo(0, y), pinStart + 5);
    await expect
      .poll(() => page.locator('.emaki-viewport').evaluate((el) => getComputedStyle(el).clipPath), { timeout: 5_000 })
      .toBe('none');
  });

  test('o cilindro some quando o fim do rolo chega', async ({ page }) => {
    await openHome(page);
    await scrollProjects(page, 1);
    await expect
      .poll(() => page.locator('.emaki-roller').evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5_000 })
      .toBeLessThan(0.05);
  });

  test.describe('em celular', () => {
    const { defaultBrowserType, ...pixel } = devices['Pixel 7'];
    test.use(pixel);

    test('abre sozinho quando aparece e o cilindro sai de cena', async ({ page }) => {
      await openHome(page);
      await page.evaluate(() => document.getElementById('projects').scrollIntoView());
      await expect
        .poll(() => page.locator('.emaki-viewport').evaluate((el) => getComputedStyle(el).clipPath), { timeout: 6_000 })
        .toBe('none');
      await expect(page.locator('.emaki-roller')).toBeHidden({ timeout: 3_000 });
    });
  });

  test.describe('com prefers-reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('sem rolo: grade aberta e sem cilindro', async ({ page }) => {
      await openHome(page);
      await expect(page.locator('.emaki-roller')).toBeHidden();
      expect(await page.locator('.emaki-viewport').evaluate((el) => getComputedStyle(el).clipPath)).toBe('none');
    });
  });
});

test('nenhum texto da página usa travessão (—)', async ({ page }) => {
  for (const path of ['/', '/projects', '/projects/imacardios', '/projects/fit-ai-api', '/certificates']) {
    await page.goto(path);
    await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
    const text = await page.evaluate(() => `${document.title}\n${document.body.innerText}`);
    expect(text, path).not.toContain('—');
  }
});
