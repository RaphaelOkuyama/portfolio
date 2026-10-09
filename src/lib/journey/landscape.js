// Paisagem ukiyo-e: altura do cume, floresta de sugi, faixas de kasumi e voo dos pássaros.
// Tudo determinístico (mesma semente, mesma paisagem) e sem three.js, para testar em Node.
import { mulberry32 } from './ridge';

// Altura do cume em x, interpolando os pontos de ridgePoints (x crescente, passo fixo)
export function ridgeHeightAt(points, x) {
  const x0 = points[0][0];
  const step = points[1][0] - x0;
  const pos = (x - x0) / step;
  if (pos <= 0) return points[0][1];
  if (pos >= points.length - 1) return points[points.length - 1][1];
  const i = Math.floor(pos);
  const f = pos - i;
  return points[i][1] + (points[i + 1][1] - points[i][1]) * f;
}

// Alturas normalizadas (0..1) para a textura do cume, com o intervalo para desnormalizar
export function ridgeProfile(points) {
  let min = Infinity;
  let max = -Infinity;
  points.forEach(([, y]) => {
    min = Math.min(min, y);
    max = Math.max(max, y);
  });
  const span = Math.max(1e-6, max - min);
  return { values: points.map(([, y]) => (y - min) / span), min, max };
}

// Sugi (杉) nas cristas: aglomerados, fora do vale por onde a câmera passa.
// Retorna [x, y, escala] com a base logo abaixo do cume (a árvore "nasce" da encosta)
// `floor(x)`: altura do chão do vale naquele x (opcional). Perto do vale o chão sobe em concha e
// passa por cima da crista: sem isso a árvore ficava enterrada, só com a ponta de fora
export function forestPlacements(points, { seed, count, halfWidth, valleyHalf, valleyCenter = 0, heightRange = [1.4, 3], floor = null }) {
  const rand = mulberry32(seed);
  // Densidade em faixas: bosques e clareiras ao longo do cume
  const phase = rand() * Math.PI * 2;
  const density = (x) => 0.5 + 0.5 * Math.sin(x * 0.11 + phase) * Math.cos(x * 0.043 + phase * 0.7);
  const trees = [];
  let guard = count * 40;
  while (trees.length < count && guard-- > 0) {
    const x = (rand() * 2 - 1) * halfWidth;
    if (Math.abs(x - valleyCenter) < valleyHalf) continue;
    if (rand() > density(x)) continue;
    const scale = heightRange[0] + rand() * (heightRange[1] - heightRange[0]);
    // Base logo abaixo do cume, só para não flutuar no declive. Antes afundava até 1,05: os sugi
    // menores (2 de altura) ficavam pela metade e viravam calombos da cor da montanha
    const sink = 0.05 + rand() * 0.25;
    let base = ridgeHeightAt(points, x) - sink;
    // Crista abaixo do chão: a árvore fica de pé no chão (um tiquinho para dentro, sem flutuar)
    if (floor) base = Math.max(base, floor(x) - 0.08);
    trees.push([x, base, scale]);
  }
  return trees;
}

// Faixas de kasumi (霞) entre as camadas de montanha, cobrindo o pé da camada de trás
export function kasumiBands(layers, { seed, every = 1 }) {
  const rand = mulberry32(seed);
  const bands = [];
  for (let i = 0; i < layers.length - 1; i += every) {
    const back = layers[i + 1];
    bands.push({
      z: (layers[i].z + back.z) / 2,
      y: back.baseHeight + back.amplitude * (0.15 + rand() * 0.2),
      height: 3.5 + rand() * 2.5,
      seed: rand() * 100,
      speed: (0.006 + rand() * 0.01) * (rand() < 0.5 ? -1 : 1),
    });
  }
  return bands;
}

// Bando de pássaros: cruza o céu durante `flight` segundos a cada `cycle` segundos.
// Retorna o deslocamento x (-span..span) ou null quando o bando está fora de cena
export function flockX(time, { cycle, flight, span, delay = 0 }) {
  const t = time - delay;
  if (t < 0) return null;
  const local = t % cycle;
  if (local > flight) return null;
  return -span + (local / flight) * span * 2;
}

// Formação em V: o líder na frente (+x), os outros atrás alternando os lados
export function flockFormation(count, { seed, spacing = 1.3 }) {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const rank = Math.ceil(i / 2);
    const side = i % 2 === 0 ? 1 : -1;
    return [
      -rank * spacing + (rand() - 0.5) * 0.5,
      rank * 0.35 * side + (rand() - 0.5) * 0.4,
      rank * 0.8 * side,
      rand() * Math.PI * 2,
    ];
  });
}
