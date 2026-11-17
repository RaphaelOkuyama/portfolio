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

test('hanabi: a palavra secreta abre o festival e o Esc fecha', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await page.keyboard.type('hanabi');
  const festival = page.locator('[data-hanabi]');
  await expect(festival).toHaveCount(1, { timeout: 15_000 });
  await page.keyboard.press('f');
  await page.keyboard.press('k');
  await page.keyboard.press('Escape');
  await expect(festival).toHaveCount(0);
  // Dentro de um campo a palavra não abre nada
  await page.locator('#contact-message').scrollIntoViewIfNeeded();
  await page.locator('#contact-message').pressSequentially('hanabi');
  await page.waitForTimeout(300);
  await expect(festival).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('modo foto: fora da cena 3D o botão fica desligado, com o motivo', async ({ page }) => {
  await page.goto('/certificates');
  await extras(page).click();
  const photo = page.locator('[data-play="photo"]');
  await expect(photo).toBeDisabled();
  await expect(photo).toContainText('página inicial');
});
