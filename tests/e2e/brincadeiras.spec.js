import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

// 遊 Extras: gachapon, festival de taiko e fogos, modo Famicom, bichinhos e modo foto

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 10_000 });
}
const extras = (page) => page.getByRole('button', { name: /^Extras/ });

test('bichinhos: dá para escolher mais de um e a escolha volta na próxima visita', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await extras(page).click();
  await page.locator('[data-pet-option="shiba"]').click();
  await page.locator('[data-pet-option="kappa"]').click();
  await expect(page.locator('[data-pet-option="shiba"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pets .pet')).toHaveCount(2);
  // Tirar um deixa o outro
  await page.locator('[data-pet-option="shiba"]').click();
  await expect(page.locator('.pets .pet')).toHaveCount(1);
  await expect(page.locator('.pets .pet')).toHaveAttribute('data-pet', 'kappa');
  await page.reload();
  await expect(page.locator('.pets .pet')).toHaveCount(1, { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test('bichinhos: dormem no tema da noite e acordam com um carinho', async ({ page }) => {
  await openHome(page);
  await extras(page).click();
  await page.locator('[data-pet-option="daruma"]').click();
  await page.keyboard.press('Escape');
  const pet = page.locator('.pets .pet');
  await expect(pet).toHaveAttribute('data-mood', 'sleep', { timeout: 8_000 });
  await pet.click();
  await expect(pet).toHaveAttribute('data-mood', 'love');
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
