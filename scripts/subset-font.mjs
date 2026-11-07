// Gera as fontes do site em subconjuntos (src/fonts/*.woff2) pela API do Google Fonts com o parâmetro
// `text`, que devolve um woff2 só com os glifos pedidos. Pelo next/font/google elas vinham em centenas
// de fatias por unicode-range (dezenas de KB de @font-face no CSS que bloqueia a primeira pintura).
//
// - Shippori Mincho latina (títulos): ASCII, Latin-1, Latin Extended-A e pontuação.
// - Shippori Mincho japonesa (.font-jp): todos os kana/kanji que aparecem no código do site. Antes
//   eles caíam nas fontes do sistema (no Android, gótica no lugar de mincho). Rode de novo ao
//   escrever kanji novos: npm run font
// - Zen Kaku Gothic New latina (texto corrido): conversa com o mincho e tem desenho japonês.
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'src/fonts';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const latin = new Set();
for (let c = 0x20; c <= 0x7e; c += 1) latin.add(String.fromCharCode(c));
for (let c = 0xa0; c <= 0x17f; c += 1) latin.add(String.fromCharCode(c));
'‐–—‘’‚“”„•…‹›€™←→↑↓·×÷°'.split('').forEach((c) => latin.add(c));

// Kana, kanji e pontuação japonesa usados no código (comentários fora)
const CJK = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/g;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/\s.*$/gm, '');
const japanese = new Set();
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(js|jsx|mdx?)$/.test(name)) (strip(readFileSync(path, 'utf8')).match(CJK) ?? []).forEach((c) => japanese.add(c));
  }
};
walk('src');

async function subset(family, weight, chars, file) {
  const text = [...chars].join('');
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/)?.[1];
  if (!src) throw new Error(`Sem woff2 para ${family} ${weight}:\n${css.slice(0, 400)}`);
  const font = Buffer.from(await (await fetch(src)).arrayBuffer());
  writeFileSync(join(OUT, file), font);
  console.log(`${file}: ${(font.length / 1024).toFixed(1)} KB (${chars.size} caracteres)`);
}

mkdirSync(OUT, { recursive: true });
for (const weight of [600, 800]) await subset('Shippori+Mincho', weight, latin, `shippori-mincho-${weight}.woff2`);
for (const weight of [500, 800]) await subset('Shippori+Mincho', weight, japanese, `shippori-mincho-jp-${weight}.woff2`);
for (const weight of [400, 500, 700]) await subset('Zen+Kaku+Gothic+New', weight, latin, `zen-kaku-gothic-new-${weight}.woff2`);
