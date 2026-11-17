import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

// 遊 Extras: gachapon, festival de taiko e fogos, modo Famicom, bichinhos e modo foto

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}
const extras = (page) => page.getByRole('button', { name: /^Extras/ });

test('Pokémon shiny: sai no sorteio ao escolher, sem botão para ligar, e a evolução herda', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await extras(page).click();
  // Não existe mais o botão de escolher shiny; a chance aparece no menu
  await expect(page.locator('[data-play="pet-shiny"]')).toHaveCount(0);
  await expect(page.locator('[data-shiny-odds]')).toContainText('1 em 20');
  // Sorteio que não dá shiny
  await page.evaluate(() => { window.__rand = Math.random; Math.random = () => 0.9; });
  await page.locator('[data-pet-option="charmander"]').click();
  await expect(page.locator('.pets .pet-sprite')).toHaveAttribute('src', '/images/pokemon/4.png');
  await expect(page.locator('[data-pet-shiny]')).toHaveCount(0);
  // Outro inicial, sorteio que dá shiny: brilho e balão no bichinho
  await page.locator('[data-pet-generation="3"]').click();
  await page.evaluate(() => { Math.random = () => 0.01; });
  await page.locator('[data-pet-option="torchic"]').click();
  await page.evaluate(() => { Math.random = window.__rand; });
  await expect(page.locator('.pets .pet-sprite')).toHaveAttribute('src', '/images/pokemon/shiny/255.png');
  await expect(page.locator('.pets .pet-note')).toContainText('shiny');
  await expect(page.locator('[data-pet-shiny]')).toBeVisible();
  // Só o escolhido aparece shiny no menu
  await expect(page.locator('[data-pet-option] img[data-shiny]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await expect(page.locator('.pets .pet')).toHaveAttribute('data-pet', 'combusken', { timeout: 15_000 });
  // A animação no próprio bichinho já usa as duas formas shiny (cor e silhueta de cada uma)
  await expect(page.locator('[data-evolution="combusken"] img[data-shiny]')).toHaveCount(4);
  await expect(page.locator('.pets .pet > .pet-sprite')).toHaveAttribute('src', '/images/pokemon/shiny/256.png', { timeout: 15_000 });
  await page.reload();
  await expect(page.locator('.pets .pet-sprite')).toHaveAttribute('src', '/images/pokemon/shiny/256.png', { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test('Pokémon: escolhe um inicial entre as três gerações e salva a escolha', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await extras(page).click();
  await page.locator('[data-pet-option="charmander"]').click();
  await expect(page.locator('[data-pet-option="charmander"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-pet-generation="3"]').click();
  await expect(page.locator('[data-pet-option]')).toHaveCount(3);
  await page.locator('[data-pet-option="mudkip"]').click();
  await page.locator('[data-pet-generation="6"]').click();
  await page.locator('[data-pet-option="froakie"]').click();
  await expect(page.locator('.pets .pet')).toHaveCount(1);
  await expect(page.locator('.pets .pet')).toHaveAttribute('data-pet', 'froakie');
  await page.screenshot({ path: 'docs/antes-depois/pokemon/menu-desktop.jpg', type: 'jpeg', quality: 85 });
  await page.reload();
  await expect(page.locator('.pets .pet')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator('.pets .pet')).toHaveAttribute('data-pet', 'froakie');
  expect(errors).toEqual([]);
});

test('Pokémon: dorme no tema da noite e acorda com um carinho', async ({ page }) => {
  await openHome(page);
  await extras(page).click();
  await page.locator('[data-pet-option="squirtle"]').click();
  await page.keyboard.press('Escape');
  const pet = page.locator('.pets .pet');
  await expect(pet).toHaveAttribute('data-mood', 'sleep', { timeout: 8_000 });
  await pet.click();
  await expect(pet).toHaveAttribute('data-mood', 'love');
});

test('Pokémon: evolui nos Projetos e no Contato, salva a forma e não regride', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await extras(page).click();
  await page.locator('[data-pet-option="charmander"]').click();
  await page.keyboard.press('Escape');
  const pet = page.locator('.pets .pet');
  await expect(pet).toHaveAttribute('data-pet', 'charmander');
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await expect(pet).toHaveAttribute('data-pet', 'charmeleon', { timeout: 15_000 });
  await expect(page.getByText('Charmander evoluiu para Charmeleon!', { exact: true })).toBeVisible({ timeout: 8_000 });
  await page.locator('#contato').scrollIntoViewIfNeeded();
  await expect(pet).toHaveAttribute('data-pet', 'charizard', { timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('oku-pets')))).toEqual(['charizard']);
  await page.reload();
  await expect(pet).toHaveAttribute('data-pet', 'charizard', { timeout: 15_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await extras(page).click();
  await expect(page.locator('[data-pet-option="charmander"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-pet-evolution] li[aria-current="step"]')).toContainText('Charizard');
  await page.locator('[data-pet-option="charmander"]').click();
  await expect(pet).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Pokémon: participa dos estouros reais do hanabi e do ritmo do taiko', async ({ page }) => {
  await openHome(page);
  await extras(page).click();
  await page.locator('[data-pet-generation="3"]').click();
  await page.locator('[data-pet-option="treecko"]').click();
  await page.keyboard.press('Escape');
  await page.keyboard.type('hanabi');
  const pets = page.locator('.pets');
  await expect(pets).toHaveAttribute('data-festival', 'hanabi');
  await expect(pets).toBeVisible();
  await expect(pets.locator('.pet')).toHaveAttribute('data-mood', 'cheer', { timeout: 15_000 });
  await page.keyboard.press('Escape');
  await expect(pets).not.toHaveAttribute('data-festival', 'hanabi');
  // O voo automático até o rio não conta como evolução.
  await expect(pets.locator('.pet')).toHaveAttribute('data-pet', 'treecko');
  await page.keyboard.type('taiko');
  await page.locator('[data-taiko-intro]').getByRole('button', { name: 'Começar' }).click();
  await expect(pets).toHaveAttribute('data-festival', 'taiko');
  await expect(pets.locator('.pet')).toHaveAttribute('data-mood', 'dance', { timeout: 5_000 });
  await page.keyboard.press('Escape');
  await expect(pets).not.toHaveAttribute('data-festival', 'taiko');
  await expect(pets.locator('.pet')).toBeVisible();
});

test('Pokémon: abrir o catálogo de Projetos também concede a primeira evolução', async ({ page }) => {
  await openHome(page);
  await extras(page).click();
  await page.locator('[data-pet-generation="6"]').click();
  await page.locator('[data-pet-option="fennekin"]').click();
  await page.keyboard.press('Escape');
  await page.locator('.desktop-menu a[href="/projects"]').click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('.pets .pet')).toHaveAttribute('data-pet', 'braixen', { timeout: 10_000 });
});

test('Pokémon: menu acessível no celular e sprites das três gerações carregados', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  await page.locator('.mobile-menu-btn').click();
  for (const [generation, id] of [[1, 'bulbasaur'], [3, 'torchic'], [6, 'froakie']]) {
    await page.locator(`[data-pet-generation="${generation}"]`).click();
    await page.locator(`[data-pet-option="${id}"]`).click();
    await expect(page.locator(`[data-pet-option="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.locator('.play img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  }
  await expect(page.locator('[data-pet-evolution] li')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/antes-depois/pokemon/menu-mobile.jpg', type: 'jpeg', quality: 85 });
  await page.locator('.mobile-menu-btn').click();
  await expect(page.locator('.pets .pet')).toBeVisible();
  await expect(page.locator('.pets .pet')).toHaveAttribute('data-pet', 'froakie');
});

test('modo Famicom: liga a tela de pixels com o placar e desliga', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await extras(page).click();
  const retro = page.locator('[data-play="retro"]');
  await retro.click();
  await expect(retro).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveClass(/retro/);
  await expect(page.locator('[data-retro-hud]')).toContainText('FASE 1-1');
  await retro.click();
  await expect(page.locator('html')).not.toHaveClass(/retro/);
  await expect(page.locator('[data-retro-hud]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('gachapon: a manivela solta uma cápsula com um prêmio', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  const open = page.locator('.gacha-open');
  await open.scrollIntoViewIfNeeded();
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Gachapon' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Girar' }).click();
  await expect(dialog.locator('.gacha-prize-title')).not.toBeEmpty({ timeout: 6_000 });
  await expect(dialog.getByRole('button', { name: 'Girar de novo' })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('gachapon: o prêmio tem raridade e entra na coleção, que volta na próxima visita', async ({ page }) => {
  await openHome(page);
  const open = page.locator('.gacha-open');
  await open.scrollIntoViewIfNeeded();
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Gachapon' });
  await expect(dialog.locator('.gacha-collection-title b')).toHaveText(/^0\//);
  await dialog.getByRole('button', { name: 'Girar' }).click();
  await expect(dialog.locator('.gacha-prize')).toHaveAttribute('data-rarity', /^(N|R|SR|SSR)$/, { timeout: 8_000 });
  await expect(dialog.locator('.gacha-new')).toBeVisible();
  await expect(dialog.locator('.gacha-collection-title b')).toHaveText(/^1\//);
  await page.reload();
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
  await open.scrollIntoViewIfNeeded();
  await open.click();
  await expect(dialog.locator('.gacha-collection-title b')).toHaveText(/^1\//);
  await expect(dialog.locator('.gacha-dot[data-on]')).toHaveCount(1);
});

test('hanabi: a palavra secreta abre o festival de fogos e o Esc fecha', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await page.keyboard.type('hanabi');
  const festival = page.locator('[data-hanabi]');
  await expect(festival).toHaveCount(1, { timeout: 15_000 });
  // O primeiro ato aparece com a legenda do tipo de fogo
  await expect(festival.locator('[data-hanabi-act="kaimaku"]')).toBeVisible({ timeout: 5_000 });
  // Um clique no céu solta um fogo, sem fechar nada
  await page.mouse.click(600, 240);
  await expect(festival).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(festival).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/festival-mode/);
  // Dentro de um campo a palavra não abre nada
  await page.locator('#contact-message').scrollIntoViewIfNeeded();
  await page.locator('#contact-message').pressSequentially('hanabi');
  await page.waitForTimeout(300);
  await expect(festival).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('taiko: a palavra abre o jogo com as regras, o nível e o botão de começar', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await page.keyboard.type('taiko');
  const game = page.locator('[data-taiko]');
  await expect(game).toHaveCount(1, { timeout: 15_000 });
  await expect(game).toHaveAttribute('data-phase', 'intro');
  await expect(game.locator('[data-taiko-intro]')).toContainText('Don');
  await expect(game.locator('[data-taiko-intro]')).toContainText('Ka');
  // Nível: o fácil vem marcado; dá para trocar
  await expect(game.locator('[data-taiko-level="kantan"]')).toHaveAttribute('aria-checked', 'true');
  await game.locator('[data-taiko-level="futsuu"]').click();
  await expect(game.locator('[data-taiko-level="futsuu"]')).toHaveAttribute('aria-checked', 'true');
  await game.getByRole('button', { name: 'Começar' }).click();
  await expect(game).toHaveAttribute('data-phase', 'play');
  await expect(game.locator('[data-taiko-score]')).toHaveText('000000');
  // Batidas no vazio não pontuam; recomeçar zera e segue jogando
  await page.keyboard.press('f');
  await page.keyboard.press('k');
  await game.locator('[data-taiko-restart]').click();
  await expect(game).toHaveAttribute('data-phase', 'play');
  await page.keyboard.press('Escape');
  await expect(game).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('taiko: batendo no tempo os pontos sobem', async ({ page }) => {
  await openHome(page);
  await page.keyboard.type('matsuri');
  const game = page.locator('[data-taiko]');
  await game.getByRole('button', { name: 'Começar' }).click();
  // Fácil a 100 bpm: a contagem leva 8 tempos (4,8 s) e as primeiras notas são don, a cada 2 tempos
  await page.waitForTimeout(4_700);
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('f');
    await page.waitForTimeout(140);
    await page.keyboard.press('f');
    await page.waitForTimeout(140);
  }
  await expect(game.locator('[data-taiko-score]')).not.toHaveText('000000', { timeout: 6_000 });
});

test('Famicom: a música desliga à parte e os pixels continuam', async ({ page }) => {
  await openHome(page);
  await extras(page).click();
  await page.locator('[data-play="retro"]').click();
  const music = page.locator('[data-retro-music]');
  await expect(music).toHaveAttribute('aria-pressed', 'true');
  await music.click();
  await expect(music).toHaveAttribute('aria-pressed', 'false');
  await expect(music).toContainText('OFF');
  await expect(page.locator('html')).toHaveClass(/retro/);
  // A escolha fica: desligar e ligar o modo de novo não traz a música de volta (o clique no
  // placar fechou o menu: abre de novo)
  await extras(page).click();
  await page.locator('[data-play="retro"]').click();
  await page.locator('[data-play="retro"]').click();
  await expect(page.locator('[data-play="retro-music"]')).toHaveAttribute('aria-pressed', 'false');
});

test('modo foto: fora da cena 3D o botão fica desligado, com o motivo', async ({ page }) => {
  await page.goto('/certificates');
  await extras(page).click();
  const photo = page.locator('[data-play="photo"]');
  await expect(photo).toBeDisabled();
  await expect(photo).toContainText('página inicial');
});
