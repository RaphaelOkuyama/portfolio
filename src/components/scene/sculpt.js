// Formas esculpidas em código (a cabeça do dragão, o corvo): seções (loft), mechas e chifres
import { BufferAttribute, BufferGeometry } from 'three';

// Escultura por seções (loft): uma superfície só, contínua, de trás para a frente. `rings` seções;
// em cada uma, `at(s)` dá z, a meia-largura w, as alturas para cima (ht) e para baixo (hb) a partir
// do centro cy, e `bump(s, a)` empurra a superfície para fora (ou para dentro) no ângulo a (0 = lado,
// π/2 = em cima). A seção é uma superelipse (um pouco quadrada, como focinho). Pontas fechadas
export const keys = (frames) => (s) => {
  // Catmull-Rom entre os quadros-chave [s, ...valores]
  let i = 0;
  while (i < frames.length - 2 && s > frames[i + 1][0]) i += 1;
  const [s0, ...a] = frames[Math.max(0, i - 1)];
  const [s1, ...b] = frames[i];
  const [s2, ...c] = frames[i + 1];
  const [, ...d] = frames[Math.min(frames.length - 1, i + 2)];
  const t = Math.min(1, Math.max(0, (s - s1) / Math.max(1e-6, s2 - s1)));
  const t2 = t * t;
  const t3 = t2 * t;
  void s0;
  return b.map((p1, k) => {
    const p0 = a[k];
    const p2 = c[k];
    const p3 = d[k];
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  });
};
export const gauss = (x, w) => Math.exp(-(x * x) / (w * w));
export function loft({ rings = 34, sides = 28, at, bump = () => 0, power = 2.4 }) {
  const pos = [];
  const index = [];
  const e = 2 / power;
  for (let r = 0; r < rings; r += 1) {
    const s = r / (rings - 1);
    const { z, w, ht, hb, cy } = at(s);
    for (let j = 0; j < sides; j += 1) {
      const a = (j / sides) * Math.PI * 2;
      const c = Math.cos(a);
      const n = Math.sin(a);
      const k = 1 + bump(s, a);
      const x = Math.sign(c) * Math.abs(c) ** e * w * k;
      const y = cy + Math.sign(n) * Math.abs(n) ** e * (n >= 0 ? ht : hb) * k;
      pos.push(x, y, z);
    }
  }
  for (let r = 0; r < rings - 1; r += 1) {
    for (let j = 0; j < sides; j += 1) {
      const a = r * sides + j;
      const b = r * sides + ((j + 1) % sides);
      index.push(a, b, a + sides, b, b + sides, a + sides);
    }
  }
  // Tampas: um ponto no centro de cada ponta
  const back = pos.length / 3;
  const b0 = at(0);
  pos.push(0, b0.cy, b0.z - 0.01);
  const front = back + 1;
  const b1 = at(1);
  pos.push(0, b1.cy, b1.z + 0.01);
  const last = (rings - 1) * sides;
  for (let j = 0; j < sides; j += 1) {
    index.push(back, (j + 1) % sides, j);
    index.push(front, last + j, last + ((j + 1) % sides));
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(index);
  g.setAttribute('uv', new BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(pos.length), 3));
  return g;
}
// Mecha de pelo (como os tufos desenhados nos filmes): lâmina ao longo de +y que afina até a ponta,
// curva para trás (-z) e com uma quina no meio (pega a luz e dá volume). `bend` curva, `wave` ondula
export function lock(len, width, { bend = 0.35, wave = 0.08, steps = 12 } = {}) {
  const pos = [];
  const index = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const w = width * (1 - t) ** 0.75 * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 2.2 + 0.25)));
    const y = t * len;
    const z = -t * t * len * bend;
    const x = Math.sin(t * Math.PI * 1.5) * len * wave;
    const ridge = w * 0.22;
    pos.push(x - w / 2, y, z, x, y, z + ridge, x + w / 2, y, z);
    if (i < steps) {
      const a = i * 3;
      index.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(index);
  return g;
}
// Chifre: tubo que afina e curva para trás ao longo de +y
export function horn(len, r0, r1, { bend = 0.3, sides = 8, steps = 10 } = {}) {
  const pos = [];
  const index = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const r = r0 + (r1 - r0) * t;
    const y = t * len;
    const z = -t * t * len * bend;
    for (let j = 0; j < sides; j += 1) {
      const a = (j / sides) * Math.PI * 2;
      pos.push(Math.cos(a) * r, y, z + Math.sin(a) * r);
    }
  }
  for (let i = 0; i < steps; i += 1) {
    for (let j = 0; j < sides; j += 1) {
      const a = i * sides + j;
      const b = i * sides + ((j + 1) % sides);
      index.push(a, a + sides, b, b, a + sides, b + sides);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(index);
  return g;
}
