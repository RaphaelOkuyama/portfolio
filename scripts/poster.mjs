// Quadro-pôster: renderiza o primeiro quadro da cena 3D (hero, qualidade alta) para cada tema e
// orientação de tela e grava em public/poster/ (AVIF + WebP). O site mostra essa imagem enquanto a
// cena não começa (PosterBackdrop), então a cena entra por cima sem nada mudar de lugar.
//
// Uso: com o site rodando (npm run dev ou npm start), `node scripts/poster.mjs [url]`
// (padrão http://localhost:3000). Precisa de GPU: o Chromium sobe com ANGLE/D3D11.
// Rode de novo sempre que a cena do hero mudar (cores, luz, objetos perto do torii).
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const OUT = 'public/poster';
// Deitada: 2.4:1 cobre de 4:3 a 21:9 com recorte central (o FOV vertical é fixo nessas telas).
// Em pé: proporção em que o FOV horizontal (52°) e o vertical máximo (85°) se encontram
const SIZES = [
  { name: 'wide', width: 2400, height: 1000 },
  { name: 'tall', width: 640, height: 1203 },
];
const THEMES = ['night', 'day'];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });

for (const theme of THEMES) {
  for (const size of SIZES) {
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
    await context.addInitScript((t) => {
      localStorage.setItem('oku-visited', '1');
      localStorage.setItem('oku-quality', 'high');
      localStorage.setItem('theme', t);
      localStorage.setItem('lang', 'pt');
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', (e) => console.log('pageerror', e.message));
    await page.goto(`${BASE}/?perf&3d`, { waitUntil: 'load' });
    // A cena começa sozinha numa GPU boa; espera ela aparecer por cima do pôster
    await page.waitForFunction(() => {
      const layer = document.querySelector('[data-scene="webgl"] > div[style*="opacity"]');
      return layer && getComputedStyle(layer).opacity === '1' && window.__r3f;
    }, null, { timeout: 60_000 });
    // Sem pétalas, folhas e neve (no site elas fogem do texto; numa foto ficariam por cima dele),
    // sem o papel washi (ele já fica por cima do pôster no site) e sem a página
    // (a cena reescreve `visible` a cada quadro: as partículas saem pela camada, que ninguém mexe)
    await page.evaluate(() => {
      window.__r3f.scene.traverse((o) => {
        if (o.material?.uniforms?.uShape) o.layers.set(31);
      });
    });
    await page.addStyleTag({ content: 'body * { visibility: hidden !important; } [data-scene], [data-scene] * { visibility: visible !important; } [data-scene] .washi { visibility: hidden !important; }' });
    await page.waitForTimeout(1500);
    const png = await page.locator('[data-scene="webgl"] canvas').first().screenshot();
    const base = `${OUT}/${theme}-${size.name}`;
    await sharp(png).avif({ quality: 52, effort: 6 }).toFile(`${base}.avif`);
    await sharp(png).webp({ quality: 74 }).toFile(`${base}.webp`);
    const { statSync } = await import('node:fs');
    console.log(`${base}.avif: ${(statSync(`${base}.avif`).size / 1024).toFixed(0)} KB`);
    await context.close();
  }
}
await browser.close();
