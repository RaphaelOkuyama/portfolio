// Corta a margem transparente dos sprites (os PNGs de 96×96 trazem o bicho pequeno no meio) e
// deixa 2 px de folga. Roda sozinho ou no fim de fetch-pokemon.mjs. Uso: node scripts/trim-pokemon.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

export async function trimSprites({ shiny = false } = {}) {
  const directory = new URL(`../public/images/pokemon/${shiny ? 'shiny/' : ''}`, import.meta.url);
  // As variantes podem ter recortes diferentes; cada uma guarda suas dimensões reais.
  const sizesFile = new URL(`../src/lib/pokemon-${shiny ? 'shiny-' : ''}sizes.js`, import.meta.url);
  const files = (await readdir(directory)).filter((f) => f.endsWith('.png'));
  const sizes = {};
  for (const file of files) {
    const url = new URL(file, directory);
    const input = await readFile(url);
    const meta = await sharp(input).metadata();
    // Já cortado (rodar duas vezes não muda nada além de recalcular o tamanho)
    if (meta.width !== 96 || meta.height !== 96) {
      sizes[file.replace('.png', '')] = [meta.width, meta.height];
      continue;
    }
    const out = await sharp(input)
      .ensureAlpha()
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
      .extend({ top: 2, bottom: 2, left: 2, right: 2, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ palette: true, compressionLevel: 9 })
      .toBuffer({ resolveWithObject: true });
    await writeFile(url, out.data);
    sizes[file.replace('.png', '')] = [out.info.width, out.info.height];
    console.log(`${file}: ${meta.width}×${meta.height} → ${out.info.width}×${out.info.height}`);
  }
  const sorted = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => Number(a) - Number(b)));
  const rows = Object.entries(sorted).map(([dex, [w, h]]) => `  ${dex}: [${w}, ${h}],`).join('\n');
  await writeFile(sizesFile, `// Gerado por scripts/trim-pokemon.mjs: largura e altura (px) de cada sprite já sem a margem\nexport default {\n${rows}\n};\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await trimSprites({ shiny: process.argv.includes('--shiny') });
