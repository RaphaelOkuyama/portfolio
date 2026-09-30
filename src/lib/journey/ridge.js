// Relevo procedural e determinístico para silhuetas de montanha (cena 3D e fundo SVG)

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Três oitavas de ruído de valor suavizado: picos largos + detalhes
const OCTAVES = [
  { knots: 4, weight: 1 },
  { knots: 9, weight: 0.45 },
  { knots: 21, weight: 0.18 },
];

export function ridgePoints({
  seed, width, segments, baseHeight, amplitude,
  valleyCenter = 0, valleyDepth = 0, valleyWidth = 1,
}) {
  const rand = mulberry32(seed);
  const octaves = OCTAVES.map((o) => ({
    ...o,
    values: Array.from({ length: o.knots + 1 }, () => rand()),
  }));

  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let h = 0;
    for (const o of octaves) {
      const pos = t * o.knots;
      const k = Math.min(Math.floor(pos), o.knots - 1);
      const f = pos - k;
      const smooth = f * f * (3 - 2 * f);
      h += (o.values[k] + (o.values[k + 1] - o.values[k]) * smooth) * o.weight;
    }
    const x = -width / 2 + t * width;
    const valley = 1 - valleyDepth * Math.exp(-((x - valleyCenter) ** 2) / (2 * valleyWidth ** 2));
    points.push([x, baseHeight + h * amplitude * valley]);
  }
  return points;
}
