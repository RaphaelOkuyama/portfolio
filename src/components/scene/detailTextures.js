import { DataTexture, RepeatWrapping, RGBAFormat, TextureLoader, LinearMipmapLinearFilter } from 'three';

// Texturas de detalhe do Poly Haven (scripts/polyhaven.mjs): só o tom, em cinza. Enquanto a imagem
// não chega, um cinza médio (detalhe neutro); a troca acontece sozinha quando ela carrega
const cache = {};
const neutral = () => {
  const t = new DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1, RGBAFormat);
  t.needsUpdate = true;
  return t;
};

export function detailTexture(name) {
  if (cache[name]) return cache[name];
  const holder = { value: neutral() };
  cache[name] = holder;
  if (typeof window !== 'undefined') {
    new TextureLoader().load(`/textures/${name}.jpg`, (texture) => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.anisotropy = 4;
      holder.value = texture;
    });
  }
  return holder;
}
