// Geometria do fundo pintado (sem WebGL): cedros nas cristas e o rio saindo do vale.
// Tudo determinístico por seed, em coordenadas SVG (y para baixo).
import { mulberry32 } from './ridge';

// Altura da crista em x, interpolando os pontos do ridgePoints (x já em 0..largura)
export function ridgeY(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

// Sugi (杉): tronco curto e três andares de copa pontuda
export function cedarPath(x, y, h) {
  const w = h * 0.42;
  const trunk = `M${(x - w * 0.06).toFixed(1)},${y.toFixed(1)} h${(w * 0.12).toFixed(1)} v${(-h * 0.16).toFixed(1)} h${(-w * 0.12).toFixed(1)} Z`;
  const tiers = [0, 1, 2].map((k) => {
    const base = y - h * (0.12 + k * 0.26);
    const half = (w / 2) * (1 - k * 0.24);
    const top = base - h * (0.46 - k * 0.04);
    return `M${(x - half).toFixed(1)},${base.toFixed(1)} L${x.toFixed(1)},${top.toFixed(1)} L${(x + half).toFixed(1)},${base.toFixed(1)} Z`;
  });
  return [trunk, ...tiers].join(' ');
}

// Árvores espalhadas ao longo da crista, fora do trecho `avoid` [x0, x1] (o vale do rio)
export function cedarsOnRidge({ seed, points, count, minHeight, maxHeight, avoid = null, sink = 6 }) {
  const rand = mulberry32(seed);
  const width = points[points.length - 1][0] - points[0][0];
  const trees = [];
  for (let i = 0; i < count; i++) {
    const x = points[0][0] + ((i + rand() * 0.8) / count) * width;
    if (avoid && x > avoid[0] && x < avoid[1]) continue;
    const h = minHeight + rand() * (maxHeight - minHeight);
    // Afunda um pouco na encosta para a base não flutuar sobre a crista
    trees.push({ x, y: ridgeY(points, x) + sink, h });
  }
  return trees;
}

// Rio em perspectiva: estreito no vale, largo e sinuoso perto de quem olha
export function riverPath({ topX, topY, bottomY, topWidth, bottomWidth, sway, seed, steps = 24 }) {
  const rand = mulberry32(seed);
  const phase = rand() * Math.PI * 2;
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // t² aproxima a perspectiva: as curvas se apertam lá longe
    const y = topY + (bottomY - topY) * t * t;
    const center = topX + Math.sin(phase + t * Math.PI * 1.6) * sway * t;
    const half = (topWidth + (bottomWidth - topWidth) * t * t) / 2;
    left.push([center - half, y]);
    right.push([center + half, y]);
  }
  const pts = [...left, ...right.reverse()];
  return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')} Z`;
}
