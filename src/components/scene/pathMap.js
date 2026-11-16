import { CatmullRomCurve3, DataTexture, LinearFilter, RedFormat, Vector3 } from 'three';
import { GROUND, SANDO } from './config';

// Mapa da distância ao caminho de pedra (参道), calculado uma vez na CPU: o chão lê dele onde
// pintar a faixa de terra batida e cascalho em volta das lajes, e a vegetação rasteira sabe onde
// não nascer. Cobre o mesmo retângulo do chão; cada pixel guarda a distância ao eixo do caminho,
// de 0 (em cima) a `reach` (longe)
export const PATH_MAP = { size: [256, 320], reach: 6 };

// Pontos ao longo dos dois trechos do caminho (até a ponte e da ponte ao pagode)
export function sandoSamples(spacing = 0.4) {
  return [SANDO.points, SANDO.farPoints].flatMap((points) => {
    const curve = new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, 0, z)), false, 'centripetal');
    return curve.getSpacedPoints(Math.ceil(curve.getLength() / spacing));
  });
}

let dataCache = null;
export function pathDistanceData() {
  if (dataCache) return dataCache;
  const [w, h] = PATH_MAP.size;
  const [width, depth] = GROUND.size;
  const [cx, cz] = GROUND.center;
  const { reach } = PATH_MAP;
  const distance = new Float32Array(w * h).fill(reach);
  const px = width / w;
  const pz = depth / h;
  // Cada ponto do caminho marca só os pixels ao alcance dele (em vez de cada pixel procurar o
  // ponto mais próximo)
  for (const p of sandoSamples()) {
    const i0 = Math.floor((p.x - cx + width / 2 - reach) / px);
    const i1 = Math.ceil((p.x - cx + width / 2 + reach) / px);
    const j0 = Math.floor((p.z - cz + depth / 2 - reach) / pz);
    const j1 = Math.ceil((p.z - cz + depth / 2 + reach) / pz);
    for (let j = Math.max(0, j0); j <= Math.min(h - 1, j1); j += 1) {
      const z = cz - depth / 2 + (j + 0.5) * pz;
      for (let i = Math.max(0, i0); i <= Math.min(w - 1, i1); i += 1) {
        const x = cx - width / 2 + (i + 0.5) * px;
        const d = Math.hypot(x - p.x, z - p.z);
        if (d < distance[j * w + i]) distance[j * w + i] = d;
      }
    }
  }
  dataCache = distance;
  return distance;
}

// Distância ao eixo do caminho num ponto do mundo (no máximo `reach`)
export function pathDistanceAt(x, z) {
  const [w, h] = PATH_MAP.size;
  const [width, depth] = GROUND.size;
  const [cx, cz] = GROUND.center;
  const i = Math.floor(((x - cx) / width + 0.5) * w);
  const j = Math.floor(((z - cz) / depth + 0.5) * h);
  if (i < 0 || j < 0 || i >= w || j >= h) return PATH_MAP.reach;
  return pathDistanceData()[j * w + i];
}

let textureCache = null;
export function pathMapTexture() {
  if (textureCache) return textureCache;
  const [w, h] = PATH_MAP.size;
  const distance = pathDistanceData();
  const bytes = new Uint8Array(w * h);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.round((distance[i] / PATH_MAP.reach) * 255);
  const texture = new DataTexture(bytes, w, h, RedFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  textureCache = { value: texture };
  return textureCache;
}
