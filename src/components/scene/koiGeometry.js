import { LatheGeometry, Shape, ShapeGeometry, Vector2 } from 'three';
import { assemble, paint } from './lowpoly';

// 鯉: carpa low-poly com o comprimento 1 ao longo de z (cabeça em +z, cauda em -z), base em y = 0.
// O desenho (manchas) fica nas cores dos vértices; a variedade "plain" sai lisa e é tingida pela
// cor da instância (ogon dourada, platina). Em cache: as mesmas em toda a cena

const WHITE = [0.97, 0.95, 0.9];
const RED = [0.86, 0.24, 0.11];
const INK = [0.13, 0.12, 0.14];
const FIN = [0.93, 0.9, 0.84];

// Manchas por variedade: faixas ao longo do corpo [z0, z1, deslocamento lateral, cor], só no dorso
const PATTERNS = {
  // 紅白 kohaku: branca com manchas vermelhas, uma delas na cabeça
  kohaku: [[0.24, 0.44, 0.02, RED], [-0.06, 0.14, -0.04, RED], [-0.3, -0.18, 0.05, RED]],
  // 昭和 showa: vermelho e preto sobre o branco
  showa: [[0.22, 0.42, -0.03, RED], [0.02, 0.16, 0.06, INK], [-0.12, 0.0, -0.05, RED], [-0.34, -0.2, 0.0, INK]],
  plain: [],
};

const cache = new Map();

function colorBody(geometry, pattern) {
  const pos = geometry.attributes.position;
  const colors = geometry.attributes.color;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    let c = WHITE;
    // Só o dorso (y acima do meio) leva mancha; a borda da mancha ondula pela posição lateral
    if (y > -0.01) {
      for (const [z0, z1, shift, color] of pattern) {
        const wobble = Math.sin(x * 22 + z * 9) * 0.03;
        if (z > z0 + wobble && z < z1 + wobble && Math.abs(x - shift) < 0.13) c = color;
      }
    }
    colors.setXYZ(i, c[0], c[1], c[2]);
  }
  return geometry;
}

function fin(points) {
  const shape = new Shape(points.map(([x, y]) => new Vector2(x, y)));
  // A forma é desenhada em XY; deitada no plano da água (y → z)
  return paint(new ShapeGeometry(shape).rotateX(Math.PI / 2), FIN);
}

export function koiGeometry(variant = 'kohaku') {
  if (cache.has(variant)) return cache.get(variant);
  // Corpo: perfil girado (lathe) em volta do eixo, achatado na vertical. t: 0 = cauda, 1 = focinho
  const profile = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    const r = 0.155 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.85);
    profile.push(new Vector2(Math.max(r, i === 0 ? 0.025 : 0), t - 0.5));
  }
  const body = new LatheGeometry(profile, 8);
  body.rotateX(Math.PI / 2);
  body.scale(1, 0.62, 1);
  colorBody(paint(body), PATTERNS[variant] ?? PATTERNS.kohaku);

  // Cauda em leque (bifurcada) atrás do corpo e as duas nadadeiras peitorais abertas
  const tail = fin([[0, 0.02], [-0.17, -0.2], [-0.05, -0.13], [0, -0.17], [0.05, -0.13], [0.17, -0.2]]);
  tail.translate(0, 0, -0.48);
  const right = fin([[0, 0], [0.16, -0.07], [0.1, -0.14]]);
  right.translate(0.1, -0.01, 0.2);
  const left = fin([[0, 0], [-0.16, -0.07], [-0.1, -0.14]]);
  left.translate(-0.1, -0.01, 0.2);

  const geometry = assemble([body, tail, right, left]);
  cache.set(variant, geometry);
  return geometry;
}
