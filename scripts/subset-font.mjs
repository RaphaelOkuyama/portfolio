// Gera a Shippori Mincho só com o latim do site (src/fonts/*.woff2), pela API do Google Fonts com
// o parâmetro `text`. Pelo next/font/google ela vinha em 244 fatias japonesas por unicode-range
// (64KB de @font-face no CSS que bloqueia a primeira pintura), e o site nem usa os glifos japoneses
// dela: kana e kanji (.font-jp) são das fontes do sistema. Uso: npm run font
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const WEIGHTS = [600, 800];
const OUT = 'src/fonts';

// ASCII, Latin-1, Latin Extended-A (acentos do português e o mácron das leituras, como imayō-iro)
// e pontuação tipográfica
const chars = new Set();
for (let c = 0x20; c <= 0x7e; c += 1) chars.add(String.fromCharCode(c));
for (let c = 0xa0; c <= 0x17f; c += 1) chars.add(String.fromCharCode(c));
'‐–—‘’‚“”„•…‹›€™←→↑↓·×÷°'.split('').forEach((c) => chars.add(c));
const text = [...chars].join('');

// Navegador moderno: a API só devolve woff2 para quem anuncia suporte
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
mkdirSync(OUT, { recursive: true });
for (const weight of WEIGHTS) {
  const url = `https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/)?.[1];
  if (!src) throw new Error(`Sem woff2 na resposta do peso ${weight}:\n${css.slice(0, 400)}`);
  const font = Buffer.from(await (await fetch(src)).arrayBuffer());
  writeFileSync(join(OUT, `shippori-mincho-${weight}.woff2`), font);
  console.log(`peso ${weight}: ${(font.length / 1024).toFixed(1)} KB`);
}
console.log(`${chars.size} caracteres`);
