import { BoxGeometry, CatmullRomCurve3, Vector3 } from 'three';
import { mulberry32 } from '../../lib/journey/ridge';
import { groundHeight } from '../../lib/journey/ground';
import { assemble, paint, placed } from './lowpoly';
import { GROUND, RIVERSIDE, SANDO } from './config';

// Caminho e escadaria de pedra: geometrias fixas (sementes fixas), em cache

let sandoCache = null;
let gangiCache = null;

const tinted = (rand, base = 0.88, spread = 0.14) => {
  const t = base + rand() * spread;
  return [t, t * 0.99, t * 0.96];
};

// Lajes de uma faixa do caminho: a cada `step` ao longo da curva, uma fileira de 2 ou 3 pedras
// retangulares que somam a largura, com frestas, um leve giro e alturas um pouco diferentes
function paveAlong(points, rand) {
  const curve = new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, 0, z)), false, 'centripetal');
  const rows = Math.max(2, Math.round(curve.getLength() / SANDO.step));
  const stones = [];
  const tangent = new Vector3();
  for (let r = 0; r <= rows; r += 1) {
    const t = r / rows;
    const center = curve.getPointAt(t);
    curve.getTangentAt(t, tangent);
    const yaw = Math.atan2(tangent.x, tangent.z);
    // Normal no chão (para os lados do caminho)
    const nx = tangent.z;
    const nz = -tangent.x;
    const count = rand() < 0.45 ? 2 : 3;
    const gap = 0.06;
    const weights = Array.from({ length: count }, () => 0.7 + rand() * 0.6);
    const total = weights.reduce((a, b) => a + b, 0);
    let across = -SANDO.width / 2;
    weights.forEach((w) => {
      const width = (w / total) * SANDO.width - gap;
      const offset = across + width / 2 + gap / 2;
      across += width + gap;
      const x = center.x + nx * offset;
      const z = center.z + nz * offset;
      const length = SANDO.step * (0.86 + rand() * 0.08);
      const height = 0.16;
      const y = groundHeight(x, z, GROUND) + 0.03 + (rand() - 0.5) * 0.025 - height / 2 + 0.06;
      // A laje acompanha a subida do terreno no sentido do caminho (senão uma ponta enterra)
      const ahead = groundHeight(x + tangent.x * length / 2, z + tangent.z * length / 2, GROUND);
      const behind = groundHeight(x - tangent.x * length / 2, z - tangent.z * length / 2, GROUND);
      const pitch = -Math.asin(Math.max(-0.9, Math.min(0.9, (ahead - behind) / length)));
      // …e também de lado, onde o barranco sobe para fora do caminho (o +x local é a normal)
      const right = groundHeight(x + nx * width / 2, z + nz * width / 2, GROUND);
      const left = groundHeight(x - nx * width / 2, z - nz * width / 2, GROUND);
      const roll = Math.asin(Math.max(-0.9, Math.min(0.9, (right - left) / width)));
      stones.push(placed(paint(new BoxGeometry(width, height, length), tinted(rand)), {
        x, y, z, rotX: pitch, rotZ: roll, rotY: yaw + (rand() - 0.5) * 0.05,
      }));
    });
  }
  return stones;
}

// 参道: o caminho do começo da montanha até a ponte, e do outro lado da ponte até o pagode
export function sandoGeometry() {
  if (!sandoCache) {
    const rand = mulberry32(211);
    sandoCache = assemble([...paveAlong(SANDO.points, rand), ...paveAlong(SANDO.farPoints, rand)]);
  }
  return sandoCache;
}

// 雁木 (gangi): escadaria larga que desce da margem esquerda para dentro da água. Cada degrau é
// um bloco maciço até abaixo do chão; os últimos ficam submersos
export function gangiGeometry() {
  if (!gangiCache) {
    const rand = mulberry32(307);
    const { x: [top, bottom], z: [z0, z1], steps } = RIVERSIDE.gangi;
    const zMid = (z0 + z1) / 2;
    const depth = Math.abs(z1 - z0);
    const run = (bottom - top) / steps;
    const yTop = groundHeight(top, zMid, GROUND) + 0.05;
    const yBottom = -0.75;
    const blocks = [];
    for (let i = 0; i < steps; i += 1) {
      const x = top + run * (i + 0.5);
      const y = yTop + (yBottom - yTop) * (i / (steps - 1));
      const height = y + 2;
      blocks.push(placed(paint(new BoxGeometry(Math.abs(run) + 0.02, height, depth), tinted(rand, 0.84, 0.12)), { x, y: y - height / 2, z: zMid }));
    }
    // Muretas de pedra dos dois lados da escadaria
    for (const z of [z0 + 0.2, z1 - 0.2]) {
      blocks.push(placed(paint(new BoxGeometry(Math.abs(bottom - top) + 0.4, 0.5, 0.4), tinted(rand, 0.78, 0.08)), {
        // Desce no sentido da água (+x): giro negativo em z
        x: (top + bottom) / 2, y: (yTop + yBottom) / 2 + 0.3, z, rotZ: -Math.atan2(yTop - yBottom, Math.abs(bottom - top)),
      }));
    }
    gangiCache = assemble(blocks);
  }
  return gangiCache;
}
