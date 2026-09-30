import { mulberry32 } from './ridge';

// Pincelada vertical sumi-e (墨絵) com leve tremor de mão, na altura dada (px).
// Curvas cúbicas suaves com desvio lateral de até `wobble` px em volta de x = width/2.
export function sumiPath(height, { width = 40, wobble = 7, segments = 8, seed = 11 } = {}) {
  const rand = mulberry32(seed);
  const cx = width / 2;
  const step = height / segments;
  let d = `M ${cx} 0`;
  for (let i = 1; i <= segments; i++) {
    const y = step * i;
    const c1x = cx + (rand() * 2 - 1) * wobble;
    const c2x = cx + (rand() * 2 - 1) * wobble;
    const x = cx + (rand() * 2 - 1) * (wobble / 3);
    d += ` C ${c1x.toFixed(1)} ${(y - step * 0.66).toFixed(1)}, ${c2x.toFixed(1)} ${(y - step * 0.33).toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}
