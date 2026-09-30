import { mulberry32 } from './ridge';
import { clamp01 } from './season';

// Volume onde as pétalas caem, em volta do começo do caminho da câmera
export const PETAL_VOLUME = { x: [-18, 18], y: [-2, 14], z: [-6, 22] };

const lerp = (a, b, t) => a + (b - a) * t;

// Por pétala: posição inicial (offsets) e [fase, velocidade de queda, velocidade de giro] (params)
export function createPetalData(count, seed = 7, volume = PETAL_VOLUME) {
  const rand = mulberry32(seed);
  const offsets = new Float32Array(count * 3);
  const params = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    offsets[i * 3] = lerp(volume.x[0], volume.x[1], rand());
    offsets[i * 3 + 1] = lerp(volume.y[0], volume.y[1], rand());
    offsets[i * 3 + 2] = lerp(volume.z[0], volume.z[1], rand());
    params[i * 3] = rand() * Math.PI * 2;
    params[i * 3 + 1] = 0.4 + rand() * 0.6;
    params[i * 3 + 2] = 0.5 + rand() * 1.5;
  }
  return { offsets, params };
}

// Pétalas só na primavera: somem até o meio do caminho para o verão
export function petalOpacity(seasonMix) {
  return 1 - clamp01(seasonMix / 0.8);
}
