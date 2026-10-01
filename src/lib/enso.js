// Ensō (円相) de pincel, gerado e determinístico (o mesmo SVG no servidor e no cliente).
// Corpo de tinta grosso no começo que afina ao longo do giro, com borda irregular, e cerdas
// que se abrem em pincel seco no fim do traço.
import { mulberry32 } from './journey/ridge';

const DEG = Math.PI / 180;

export const ENSO = {
  cx: 110,
  cy: 110,
  radius: 74,
  // Começa embaixo à esquerda e gira no sentido horário da tela (sobe pela esquerda)
  startDeg: 128,
  sweepDeg: 318,
  maxWidth: 34,
  bristles: 58,
  // Riscos claros dentro da tinta (papel aparecendo entre as cerdas)
  scratches: 9,
  // Onde o corpo de tinta acaba e só sobram as cerdas
  coreEnd: 0.5,
  samples: 64,
};

// Espessura ao longo do traço (0..1): carga de tinta no começo, afinando até o fim
export function brushWidth(t, { maxWidth } = ENSO) {
  const attack = Math.min(1, 0.55 + t * 6);
  const release = 1 - 0.82 * Math.pow(t, 1.15);
  return maxWidth * attack * release;
}

// Centro do traço com uma leve oscilação (mão humana, não compasso)
export function brushCenter(t, cfg = ENSO) {
  const a = (cfg.startDeg + cfg.sweepDeg * t) * DEG;
  const r = cfg.radius * (1 + 0.022 * Math.sin(a * 3 + 1.3) + 0.012 * Math.sin(a * 7 + 0.4));
  return { x: cfg.cx + Math.cos(a) * r, y: cfg.cy + Math.sin(a) * r, a };
}

const fmt = (n) => Math.round(n * 10) / 10;

function offsetPoint(t, offset, cfg) {
  const { x, y, a } = brushCenter(t, cfg);
  // Normal radial: offset > 0 vai para fora do círculo
  return [fmt(x + Math.cos(a) * offset), fmt(y + Math.sin(a) * offset)];
}

function polyline(points) {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
}

// Corpo: contorno externo indo, interno voltando, com borda rasgada por ruído
function corePath(cfg, rand) {
  const n = Math.round(cfg.samples * cfg.coreEnd);
  const outer = [];
  const inner = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * cfg.coreEnd;
    // O corpo se desfaz nas cerdas no último trecho
    const fade = 1 - Math.max(0, (t - cfg.coreEnd * 0.7) / (cfg.coreEnd * 0.3));
    const half = (brushWidth(t, cfg) / 2) * 0.86 * fade;
    outer.push(offsetPoint(t, half * (1 + (rand() - 0.5) * 0.12), cfg));
    inner.push(offsetPoint(t, -half * (1 + (rand() - 0.5) * 0.18), cfg));
  }
  // Ponta inicial arredondada e irregular (onde o pincel encostou no papel)
  const start = [];
  const half0 = (brushWidth(0, cfg) / 2) * 0.86;
  const { x: sx, y: sy, a } = brushCenter(0, cfg);
  const back = a - Math.PI / 2; // direção oposta ao movimento
  for (let k = 1; k < 6; k++) {
    const ang = Math.PI * (k / 6);
    const d = half0 * (0.9 + rand() * 0.25);
    const rx = Math.cos(a) * Math.cos(ang) * d + Math.cos(back) * Math.sin(ang) * d * 0.55;
    const ry = Math.sin(a) * Math.cos(ang) * d + Math.sin(back) * Math.sin(ang) * d * 0.55;
    start.push([fmt(sx + rx), fmt(sy + ry)]);
  }
  return `${polyline([...outer, ...inner.reverse(), ...start.reverse()])}Z`;
}

// Cerdas: linhas finas paralelas ao traço; as de borda secam antes, e no fim falham (pincel seco)
function bristlePaths(cfg, rand) {
  const paths = [];
  for (let b = 0; b < cfg.bristles; b++) {
    const lane = (b / (cfg.bristles - 1)) * 2 - 1; // -1 (dentro) .. 1 (fora)
    const edge = Math.abs(lane);
    const tStart = rand() * 0.04;
    const tEnd = Math.min(1, 0.72 + (1 - edge) * 0.24 + (rand() - 0.5) * 0.12);
    const width = 0.5 + rand() * 1.3 * (1 - edge * 0.5);
    const opacity = fmt(0.55 + rand() * 0.45);
    const points = [];
    const n = Math.round(cfg.samples * (tEnd - tStart));
    let segment = [];
    for (let i = 0; i <= n; i++) {
      const t = tStart + (i / n) * (tEnd - tStart);
      // Falhas de tinta só no trecho seco
      const dry = t > cfg.coreEnd * 0.8 && rand() < 0.07 + t * 0.06;
      if (dry) {
        if (segment.length > 1) points.push(segment);
        segment = [];
        continue;
      }
      const jitter = (rand() - 0.5) * 0.8;
      segment.push(offsetPoint(t, (brushWidth(t, cfg) / 2) * lane * 0.95 + jitter, cfg));
    }
    if (segment.length > 1) points.push(segment);
    if (points.length) {
      paths.push({ d: points.map(polyline).join(''), width: fmt(width), opacity });
    }
  }
  return paths;
}

// Riscos de papel dentro do corpo: onde as cerdas se separaram e a tinta não chegou
function scratchPaths(cfg, rand) {
  return Array.from({ length: cfg.scratches }, () => {
    const lane = (rand() - 0.5) * 1.3;
    const t0 = 0.1 + rand() * 0.25;
    const t1 = Math.min(cfg.coreEnd, t0 + 0.12 + rand() * 0.25);
    const n = Math.max(2, Math.round(cfg.samples * (t1 - t0)));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = t0 + (i / n) * (t1 - t0);
      pts.push(offsetPoint(t, (brushWidth(t, cfg) / 2) * lane * 0.8 + (rand() - 0.5) * 0.5, cfg));
    }
    return { d: polyline(pts), width: fmt(0.5 + rand() * 1.1), opacity: fmt(0.5 + rand() * 0.4) };
  });
}

// Linha central para a máscara que "pinta" o traço com DrawSVG
function guidePath(cfg) {
  const pts = [];
  for (let i = 0; i <= cfg.samples; i++) {
    const { x, y } = brushCenter(i / cfg.samples, cfg);
    pts.push([fmt(x), fmt(y)]);
  }
  return polyline(pts);
}

export function ensoShapes(cfg = ENSO, seed = 8) {
  const rand = mulberry32(seed);
  return {
    core: corePath(cfg, rand),
    bristles: bristlePaths(cfg, rand),
    scratches: scratchPaths(cfg, rand),
    guide: guidePath(cfg),
    guideWidth: cfg.maxWidth * 1.25,
  };
}
