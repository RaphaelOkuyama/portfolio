// Texturas de detalhe da cena, do Poly Haven (CC0): baixa o mapa difuso 1K de cada uma e grava em
// public/textures/ só a luminância (tons de cinza, contraste normalizado, 512 px, JPG). A cena usa
// esse tom para variar a cor da paleta (pedra, musgo, folhas, neve) sem trocar o traço pintado.
// Uso: node scripts/polyhaven.mjs
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const OUT = 'public/textures';
// arquivo local → asset do Poly Haven
const ASSETS = {
  stone: 'lichen_rock', // granito das lanternas, komainu e lajes do caminho
  rock: 'mossy_rock', // o iwakura
  ground: 'forest_floor', // chão da primavera e do verão
  leaves: 'forest_leaves_02', // chão do outono
  snow: 'snow_02', // chão do inverno
};
const UA = { 'User-Agent': 'portfolio-raphael-okuyama/1.0 (texturas de detalhe)' };

mkdirSync(OUT, { recursive: true });
for (const [name, id] of Object.entries(ASSETS)) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`, { headers: UA })).json();
  const url = files.Diffuse?.['1k']?.jpg?.url ?? files.diffuse?.['1k']?.jpg?.url;
  if (!url) throw new Error(`Sem difuso 1K para ${id}`);
  const image = Buffer.from(await (await fetch(url, { headers: UA })).arrayBuffer());
  const file = `${OUT}/${name}.jpg`;
  await sharp(image).greyscale().normalise().resize(512, 512).jpeg({ quality: 82, mozjpeg: true }).toFile(file);
  console.log(`${file} ← ${id}`);
}
