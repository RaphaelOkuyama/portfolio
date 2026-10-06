import { describe, it, expect } from 'vitest';
import { CatmullRomCurve3, Vector3 } from 'three';
import { CAMERA_PATH, MOUNTAIN_LAYERS, FOREST, GARDEN, GROUND, TANABATA } from '../../src/components/scene/config';
import { tanzakuLayout } from '../../src/lib/journey/tanabata';
import { resumeData } from '../../src/data/resume';
import { ridgePoints } from '../../src/lib/journey/ridge';
import { ridgeHeightAt, forestPlacements } from '../../src/lib/journey/landscape';
import { groundHeight } from '../../src/lib/journey/ground';

// Nada da montanha pode esconder as tiras de Tanabata da clareira do Stack: de qualquer ponto do
// caminho da câmera, a linha até cada tira não pode cruzar uma silhueta de camada, uma árvore
// dela, nem o próprio chão do vale.

const curve = new CatmullRomCurve3(CAMERA_PATH.map((p) => new Vector3(...p)));
const layers = MOUNTAIN_LAYERS.map((layer) => {
  const points = ridgePoints(layer);
  // Floresta na maior densidade (qualidade alta): o pior caso
  const trees = forestPlacements(points, {
    seed: layer.seed + 5, count: FOREST.count.high, halfWidth: FOREST.halfWidth, valleyHalf: layer.forestValleyHalf ?? FOREST.valleyHalf, valleyCenter: layer.valleyCenter,
  });
  return { layer, points, trees };
});

// Altura da silhueta da camada em x (cume ou copa de sugi, o que for mais alto)
function silhouetteAt({ layer, points, trees }, x, index) {
  const lx = x - layer.x;
  let top = ridgeHeightAt(points, lx);
  const grow = 1 + index * FOREST.growWithDistance;
  for (const [tx, ty, s] of trees) {
    const scale = s * grow;
    const half = 0.42 * scale * 0.8;
    if (Math.abs(lx - tx) < half) {
      // Cone: altura cai linearmente do centro (1,45·escala) até a borda
      const h = ty + 1.45 * scale * (1 - Math.abs(lx - tx) / half);
      top = Math.max(top, h);
    }
  }
  return top;
}

// Pontos das tiras de Tanabata (o alto de cada uma, onde amarra no galho, e a ponta de baixo)
const bamboos = TANABATA.bamboos.map((bb) => ({ ...bb, y: groundHeight(bb.x, bb.z, GROUND), height: TANABATA.height }));
const counts = resumeData.pt.techSection.categories.map((c) => c.items.length);
const stripPoints = tanzakuLayout(counts, bamboos).flatMap((st) => [
  new Vector3(st.x, st.y, st.z),
  new Vector3(st.x, st.y - TANABATA.strip[1] - 0.1, st.z),
]);

// Primeiro obstáculo entre a câmera e o ponto, ou null se a linha estiver livre
function blocker(cam, p) {
  for (let i = 0; i < layers.length; i++) {
    const { layer } = layers[i];
    // Camada entre a câmera e o ponto (planos verticais em z)
    if (!((cam.z > layer.z && layer.z > p.z) || (cam.z < layer.z && layer.z < p.z))) continue;
    const s = (layer.z - cam.z) / (p.z - cam.z);
    const x = cam.x + (p.x - cam.x) * s;
    const y = cam.y + (p.y - cam.y) * s;
    const top = silhouetteAt(layers[i], x, i);
    if (y < top - 1e-3) return `camada z=${layer.z} em x=${x.toFixed(2)} (raio y=${y.toFixed(2)} < silhueta ${top.toFixed(2)})`;
  }
  // Chão do vale entre os dois (amostrado ao longo do raio)
  for (let k = 1; k < 60; k++) {
    const s = k / 60;
    const x = cam.x + (p.x - cam.x) * s;
    const y = cam.y + (p.y - cam.y) * s;
    const z = cam.z + (p.z - cam.z) * s;
    // Perto do ponto o raio pode encostar no chão em volta: ignora o último trecho
    if (Math.hypot(x - p.x, z - p.z) < 0.6) continue;
    if (y < groundHeight(x, z, GROUND) - 1e-3) return `chão em z=${z.toFixed(2)} x=${x.toFixed(2)}`;
  }
  return null;
}

describe('七夕: nenhuma tira escondida atrás da montanha', () => {
  it('da câmera chegando à clareira, nenhum raio até as tiras é bloqueado', () => {
    const problems = [];
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const cam = curve.getPointAt(Math.min(1, t));
      // Só importa enquanto os bambus estão à frente da câmera (e não ao lado dela)
      if (cam.z <= GARDEN.z + 3) continue;
      for (const p of stripPoints) {
        const hit = blocker(cam, p);
        if (hit) {
          problems.push(`t=${t.toFixed(2)} cam z=${cam.z.toFixed(1)} → tira (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}): ${hit}`);
          break;
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
