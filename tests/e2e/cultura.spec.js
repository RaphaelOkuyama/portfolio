import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}

test.describe('名刺 Meishi', () => {
  test('o cartão abre de frente em japonês, vira para o latino com QR e salva o vCard', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await openHome(page);
    await page.getByRole('button', { name: 'Pegar meu cartão' }).click();

    const dialog = page.getByRole('dialog', { name: /Cartão de visita/ });
    await expect(dialog).toBeVisible();
    const card = dialog.locator('[data-meishi-card]');
    await expect(card.locator('.meishi-front')).toContainText('ラファエル 信幸 芳賀 奥山');
    // Proporção do meishi japonês: 91×55 mm (medida depois que o cartão termina de girar até a pessoa)
    await expect
      .poll(async () => { const box = await card.boundingBox(); return Math.round((box.width / box.height) * 10) / 10; }, { timeout: 5_000 })
      .toBeCloseTo(91 / 55, 1);

    // Dentro do diálogo o cursor do sistema volta (o ponto de tinta fica atrás da camada do modal)
    await expect(dialog.getByRole('button', { name: 'Virar cartão' })).toHaveCSS('cursor', 'pointer');
    await dialog.getByRole('button', { name: 'Virar cartão' }).click();
    await expect(card).toHaveClass(/is-flipped/);
    await expect(card.locator('.meishi-back')).toContainText('Raphael Nobuyuki Haga Okuyama');
    await expect(card.getByRole('img', { name: 'QR code com o meu contato' }).locator('svg')).toHaveCount(1);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: 'Salvar contato' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('raphael-okuyama.vcf');
    const vcard = await (await download.createReadStream()).toArray().then((chunks) => Buffer.concat(chunks).toString('utf8'));
    expect(vcard).toContain('BEGIN:VCARD');
    expect(vcard).toContain('FN:Raphael Nobuyuki Haga Okuyama');
    expect(vcard).toContain('EMAIL;TYPE=INTERNET:raphaelokuyama123@gmail.com');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(errors).toEqual([]);
  });
});

// Acha um ponto do torii sem clicar às cegas: dentro da página, passa um ponteiro de mouse por uma
// grade no centro da hero e para onde a dica do omikuji acende (o mesmo raycast do clique).
// Depois clica de verdade nesse ponto
async function clickTorii(page) {
  const point = await page.evaluate(async () => {
    const hint = document.querySelector('.omikuji-hint');
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    // A trave (kasagi) fica perto de 36% da altura: começa por ela e se afasta para cima e para baixo
    const rows = [0.36, 0.34, 0.38, 0.32, 0.4, 0.3, 0.44, 0.5, 0.56, 0.62, 0.68, 0.74];
    for (const row of rows) {
      for (let col = 0.36; col <= 0.64; col += 0.02) {
        const x = Math.round(innerWidth * col);
        const y = Math.round(innerHeight * row);
        const el = document.elementFromPoint(x, y);
        if (!el || el.closest('a, button, header, nav')) continue;
        el.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse', bubbles: true }));
        await frame();
        if (hint.dataset.visible === 'true') return { x, y };
      }
    }
    return null;
  });
  if (!point) throw new Error('nenhum ponto do torii encontrado na hero');
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('[data-omikuji-slip]')).toBeVisible();
  return point;
}

test.describe('おみくじ Omikuji', () => {
  test('não há caixa na tela: clicar no torii da hero tira a sorte', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.omikuji-box')).toHaveCount(0);
    // O céu (canto de cima) não é o torii
    await page.mouse.click(Math.round(page.viewportSize().width * 0.9), 140);
    await expect(page.locator('[data-omikuji-slip]')).toBeHidden();

    await clickTorii(page);
    const slip = page.locator('[data-omikuji-slip]');
    await expect(slip.locator('.omikuji-rank-kanji')).toHaveText(/^(大吉|中吉|小吉|吉|末吉|凶)$/);
    await expect(slip.locator('.omikuji-number')).toContainText(/第.+番/);
    await expect(slip.locator('.omikuji-line dt')).toHaveText([/仕事/, /学問/, /待人/, /失物/]);

    // Tirar de novo mantém o papel aberto
    const again = slip.getByRole('button', { name: 'Tirar de novo' });
    await again.click();
    await expect(slip).toBeVisible();
    // Dentro do diálogo o cursor do sistema volta (o ponto de tinta fica atrás da camada do modal)
    await expect(again).toHaveCSS('cursor', 'pointer');
    await page.keyboard.press('Escape');
    await expect(slip).toBeHidden();
  });

  test('ao passar o mouse no torii aparece a dica; rolar a página esconde', async ({ page }) => {
    await openHome(page);
    const point = await clickTorii(page);
    await page.keyboard.press('Escape');
    // Sai e volta exatamente ao ponto achado (1px ao lado pode cair fora de um pilar fino); com a
    // máquina carregada o raycast pode perder o frame, então repete o movimento até a dica acender
    const hint = page.locator('.omikuji-hint');
    await expect.poll(async () => {
      await page.mouse.move(point.x - 40, point.y - 40);
      await page.mouse.move(point.x, point.y, { steps: 4 });
      return hint.getAttribute('data-visible');
    }, { timeout: 8_000 }).toBe('true');
    await expect(hint).toContainText('Clique no torii para tirar a sorte');
    await page.mouse.wheel(0, 600);
    await expect(hint).toHaveAttribute('data-visible', 'false');
  });

  test('pelo teclado, um botão aparece no foco e tira a sorte', async ({ page }) => {
    await openHome(page);
    const button = page.getByRole('button', { name: /Tirar a sorte/ });
    await button.focus();
    await expect(button).toHaveCSS('opacity', '1');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-omikuji-slip]')).toBeVisible();
  });

  test('quem tira 凶 amarra o papel no galho', async ({ page }) => {
    // Sorteio sempre no fim da tabela de pesos: cai no 凶
    await page.addInitScript(() => { Math.random = () => 0.999; });
    await openHome(page);
    await page.getByRole('button', { name: /Tirar a sorte/ }).focus();
    await page.keyboard.press('Enter');
    const slip = page.locator('[data-omikuji-slip]');
    await expect(slip.locator('.omikuji-rank-kanji')).toHaveText('凶', { timeout: 5_000 });
    await expect(slip.locator('.omikuji-tie-note')).toBeVisible();
    await slip.getByRole('button', { name: 'Amarrar no galho' }).click();
    await expect(slip).toBeHidden({ timeout: 3_000 });
  });
});

test.describe('七十二候 microestações', () => {
  // Relógio fixo congela o tempo do ensō: entra como visita de volta, sem loader
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('oku-visited', '1'));
  });

  test('o rodapé mostra a microestação de agora no Japão (pelo fuso de Tóquio)', async ({ page }) => {
    // 2 de outubro, 12h UTC = 21h em Tóquio: ainda 蟄虫坏戸 (começa em 28/9; 水始涸 só em 3/10)
    await page.clock.setFixedTime(new Date('2026-10-02T12:00:00Z'));
    await openHome(page);
    const season = page.locator('[data-microseason]');
    await season.scrollIntoViewIfNeeded();
    await expect(season.locator('.sf-season-kanji')).toHaveText('蟄虫坏戸');
    await expect(season).toContainText('Os insetos fecham suas tocas');
  });

  test('perto da meia-noite de Tóquio já vale a microestação do dia seguinte', async ({ page }) => {
    // 2 de outubro, 16h UTC = 3 de outubro, 1h em Tóquio
    await page.clock.setFixedTime(new Date('2026-10-02T16:00:00Z'));
    await openHome(page);
    await expect(page.locator('[data-microseason] .sf-season-kanji')).toHaveText('水始涸');
  });
});

test.describe('書道 Shodō no loader', () => {
  test('na primeira visita, 奥山 é escrito traço a traço dentro do ensō', async ({ page }) => {
    await page.goto('/');
    const shodo = page.locator('[data-loader="enso"] [data-shodo]');
    await expect(shodo).toBeVisible();
    // 奥 tem 12 traços e 山 tem 3
    await expect(shodo.locator('[data-shodo-stroke]')).toHaveCount(15);
    // Acompanha o pincel a cada frame até o loader sair: o último traço (o 3º de 山) aparece
    // vazio e termina desenhado antes do ensō sumir. O DrawSVG desenha pelo dasharray: o primeiro
    // valor é o trecho visível (0 = vazio, o comprimento do caminho = inteiro)
    const brush = await page.evaluate(() => new Promise((resolve) => {
      const seen = { lastStartedEmpty: false, lastFinished: false };
      const tick = () => {
        const strokes = document.querySelectorAll('[data-loader="enso"] [data-shodo-stroke]');
        if (!strokes.length) return resolve(seen);
        const last = strokes[strokes.length - 1];
        const visible = parseFloat(getComputedStyle(last).strokeDasharray) || 0;
        if (visible < 0.5) seen.lastStartedEmpty = true;
        if (seen.lastStartedEmpty && visible >= last.getTotalLength() - 0.5) seen.lastFinished = true;
        requestAnimationFrame(tick);
      };
      tick();
    }));
    expect(brush).toEqual({ lastStartedEmpty: true, lastFinished: true });
  });
});

test.describe('家紋 Kamon', () => {
  test('o brasão 奥山 está no logo da navbar e no favicon', async ({ page, request }) => {
    await openHome(page);
    await expect(page.locator('.nav-brand [data-kamon]')).toBeVisible();
    const icon = await (await request.get('/icon.svg')).text();
    expect(icon).toContain('家紋');
    expect(icon).toContain('<mask id="snow">');
  });
});

test.describe('ふりがな Furigana', () => {
  test('os kanji dos títulos e do trilho trazem a leitura em hiragana', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('#about .section-kanji rt')).toHaveText('ひと');
    await expect(page.locator('#stack .section-kanji rt')).toHaveText('わざ');
    await expect(page.locator('#contato .section-kanji rt')).toHaveText('えん');
    await expect(page.locator('.section-rail-kanji rt')).toHaveText(['やま', 'ひと', 'わざ', 'さく', 'あゆみ', 'えん']);
  });
});

test.describe('墨流し Suminagashi', () => {
  test('a tinta flutua no fundo do cartão no hover', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator('filter#suminagashi')).toHaveCount(1);
    const card = page.locator('.pj-card').first();
    const ink = () => card.evaluate((el) => getComputedStyle(el, '::before').opacity);
    expect(await ink()).toBe('0');
    await card.hover();
    await expect.poll(ink).toBe('1');
    // Os anéis nascem de onde o mouse entrou
    expect(await card.evaluate((el) => el.style.getPropertyValue('--sumi-x'))).toMatch(/%$/);
  });
});

test.describe('縦書き e 伝統色', () => {
  test('cada seção tem o nome em japonês na vertical, pendurado sem quebrar o título', async ({ page }) => {
    await openHome(page);
    const tate = page.locator('.section-tate');
    await expect(tate).toHaveText(['自己紹介', '技術', '作品', '経歴', 'ご縁']);
    await expect(tate.first()).toHaveCSS('writing-mode', 'vertical-rl');
    // Fora do fluxo: o título do contato (coluna estreita) continua numa linha só
    const title = page.locator('#contato h2.section-title');
    const lineHeight = await title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize) * 1.6);
    expect((await title.boundingBox()).height).toBeLessThan(lineHeight);
  });

  test('a cor tradicional da estação aparece no trilho e tinge os kanji das seções', async ({ page }) => {
    await openHome(page);
    const ink = page.locator('.section-rail-ink');
    // No começo da montanha é primavera: 桃色 à noite
    await expect(ink.locator('.font-jp')).toHaveText('桃色');
    await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--season'))).toBe('#f09199');
    await expect(page.locator('#about .section-kanji')).toHaveCSS('color', 'rgb(240, 145, 153)');
    // Descendo até a experiência a estação muda (outono/inverno)
    await page.evaluate(() => document.getElementById('experience').scrollIntoView());
    await expect.poll(() => ink.locator('.font-jp').textContent(), { timeout: 6_000 }).not.toBe('桃色');
  });
});

test.describe('和紙 Washi', () => {
  test('os cartões têm a textura de fibras de papel por trás do conteúdo', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
    const after = await page.locator('.pj-card').first().evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { image: s.backgroundImage, z: s.zIndex, opacity: Number(s.opacity) };
    });
    expect(after.image).toContain('feTurbulence');
    expect(after.z).toBe('-1');
    expect(after.opacity).toBeGreaterThan(0);
    expect(after.opacity).toBeLessThan(0.3);
  });
});

test.describe('扇子 Sensu no menu do celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('o menu abre como um leque de 12 lâminas e se dobra ao fechar', async ({ page }) => {
    await openHome(page);
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.locator('[data-mobile-menu]');
    await expect(menu.locator('[data-sensu] .sensu-blade')).toHaveCount(12);
    // Aberto: a última lâmina se desdobrou até a borda esquerda (fechada, fica colada à direita)
    await expect.poll(() => menu.locator('[data-blade="11"]').evaluate((el) => Math.round(el.getBoundingClientRect().left)), { timeout: 3_000 })
      .toBeLessThanOrEqual(1);
    await expect(menu.getByRole('link', { name: 'Projetos' })).toBeVisible();
    await page.getByRole('button', { name: 'Fechar menu' }).click();
    await expect(menu).toHaveCount(0, { timeout: 3_000 });
  });
});

test.describe('画質 Qualidade gráfica', () => {
  // O teste é do seletor e da escolha salva, não do visual: sem WebGL, para a cena em "Alto"
  // (bloom, resolução máxima) não saturar a CPU e atrasar os outros testes rodando em paralelo
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
        return /webgl/i.test(type) ? null : original.call(this, type, ...args);
      };
    });
  });

  test('começa no mínimo; a escolha fica salva e vale depois de recarregar', async ({ page }) => {
    await openHome(page);
    const open = page.getByRole('button', { name: /Gráficos: Mínimo/ });
    await expect(open).toBeVisible();
    await open.click();
    const group = page.getByRole('radiogroup', { name: /Gráficos/ });
    await expect(group.getByRole('radio', { name: /Mínimo/ })).toHaveAttribute('aria-checked', 'true');
    await group.getByRole('radio', { name: /Alto/ }).click();
    await expect(group).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('oku-quality'))).toBe('high');
    await page.reload();
    await expect(page.getByRole('button', { name: /Gráficos: Alto/ })).toBeVisible({ timeout: 10_000 });
  });

  test.describe('no celular', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('as três opções aparecem dentro do menu em leque', async ({ page }) => {
      await openHome(page);
      await page.getByRole('button', { name: 'Abrir menu' }).click();
      const group = page.locator('[data-mobile-menu]').getByRole('radiogroup', { name: /Gráficos/ });
      await expect(group.getByRole('radio')).toHaveCount(3);
      await group.getByRole('radio', { name: /Médio/ }).click();
      await expect(group.getByRole('radio', { name: /Médio/ })).toHaveAttribute('aria-checked', 'true');
      expect(await page.evaluate(() => localStorage.getItem('oku-quality'))).toBe('medium');
    });
  });
});
