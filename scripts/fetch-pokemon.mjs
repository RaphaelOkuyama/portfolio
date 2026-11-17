// Atualização manual dos sprites locais. Fonte: public/images/pokemon/README.md.
import { mkdir, writeFile } from 'node:fs/promises';
import { PETS } from '../src/lib/pets.js';
import { trimSprites } from './trim-pokemon.mjs';
const directory = new URL('../public/images/pokemon/', import.meta.url);
await mkdir(directory, { recursive: true });
await mkdir(new URL('shiny/', directory), { recursive: true });
await Promise.all(PETS.flatMap(({ dex }) => ['', 'shiny/'].map(async (variant) => {
  const response = await fetch(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${variant}${dex}.png`);
  if (!response.ok) throw new Error(`Sprite ${variant}${dex}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Sprite ${variant}${dex}: PNG inválido`);
  await writeFile(new URL(`${variant}${dex}.png`, directory), bytes);
})));
// Os PNGs vêm com muita margem vazia: corta e regrava os tamanhos (src/lib/pokemon-sizes.js)
await trimSprites();
await trimSprites({ shiny: true });
console.log(`${PETS.length * 2} sprites locais atualizados (normal e shiny).`);
