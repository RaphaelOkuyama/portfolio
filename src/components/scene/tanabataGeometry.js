import { ConeGeometry, CylinderGeometry, PlaneGeometry, Quaternion, SphereGeometry, Vector3 } from 'three';
import { assemble, paint, placed } from './lowpoly';
import { branchFor, branchPoint } from '../../lib/journey/tanabata';

// 七夕: peças low-poly dos bambus de Tanabata. Coordenadas locais com a base do colmo na origem;
// as cores finais vêm do material (bambu, folha) ou da instância (tiras). Em cache

const memo = new Map();
const cached = (key, build) => {
  if (!memo.has(key)) memo.set(key, build());
  return memo.get(key);
};
const UP = new Vector3(0, 1, 0);

// Cilindro de a até b (galhos, corda)
export function segment(a, b, radius, sides = 6) {
  const dir = new Vector3().subVectors(b, a);
  const g = paint(new CylinderGeometry(radius * 0.8, radius, dir.length(), sides));
  g.applyQuaternion(new Quaternion().setFromUnitVectors(UP, dir.clone().normalize()));
  const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

// Folha de sasa: cone achatado apontando na direção `dir` (pendendo para baixo e para fora)
function leaf(at, dir, length = 0.5) {
  const g = new ConeGeometry(0.07, length, 3);
  g.scale(1, 1, 0.3);
  g.translate(0, length / 2, 0);
  g.applyQuaternion(new Quaternion().setFromUnitVectors(UP, dir.clone().normalize()));
  g.translate(at.x, at.y, at.z);
  return paint(g);
}

// Colmo com nós, os três galhos (um por área deste lado) e as folhas: { wood, leaves }
export function tanabataBambooGeometry(height, side) {
  return cached(`bamboo-${height}-${side}`, () => {
    const wood = [placed(paint(new CylinderGeometry(0.1, 0.15, height, 8)), { y: height / 2 })];
    for (let y = 0.7; y < height - 0.4; y += 0.85) {
      wood.push(placed(paint(new CylinderGeometry(0.16, 0.16, 0.05, 8)), { y }));
    }
    const leaves = [];
    const base = { x: 0, y: 0, z: 0 };
    const areas = side < 0 ? [0, 2, 4] : [1, 3, 5];
    areas.forEach((area, n) => {
      const branch = branchFor(area);
      const pts = [0, 0.33, 0.66, 1].map((t) => {
        const p = branchPoint(base, side, branch.height * height, branch.length, t);
        return new Vector3(p.x, p.y, p.z);
      });
      for (let i = 0; i < pts.length - 1; i += 1) wood.push(segment(pts[i], pts[i + 1], 0.035 - i * 0.008));
      // Raminhos e folhas ao longo do galho, mais cheios na ponta
      pts.slice(1).forEach((p, i) => {
        const count = 3 + i * 2;
        for (let k = 0; k < count; k += 1) {
          const a = (k / count) * Math.PI * 2 + n;
          leaves.push(leaf(p, new Vector3(side * 0.6 + Math.cos(a) * 0.5, -0.55 + Math.sin(a) * 0.4, Math.sin(a * 1.7) * 0.6)));
        }
      });
    });
    // Copa: um tufo de folhas no alto do colmo, pendendo para os lados
    for (let k = 0; k < 22; k += 1) {
      const a = (k / 22) * Math.PI * 2;
      const at = new Vector3(Math.cos(a) * 0.12, height - 0.2 - (k % 4) * 0.35, Math.sin(a) * 0.12);
      leaves.push(leaf(at, new Vector3(Math.cos(a), -0.35 + (k % 3) * 0.25, Math.sin(a)), 0.6));
    }
    return { wood: assemble(wood), leaves: assemble(leaves) };
  });
}

// 短冊: tira de papel pendurada pelo fio, com o ponto de giro no alto (onde amarra no galho)
export function tanzakuGeometry(w = 0.17, h = 0.52) {
  return cached(`tanzaku-${w}-${h}`, () => assemble([
    placed(paint(new PlaneGeometry(w, h)), { y: -h / 2 - 0.1 }),
    placed(paint(new CylinderGeometry(0.006, 0.006, 0.1, 4)), { y: -0.05 }),
  ]));
}

// 吹き流し: bola de papel (くす玉) com serpentinas longas nas cinco cores, pendurada pelo alto
export function fukinagashiGeometry(colors, length = 2.4) {
  return cached(`fukinagashi-${colors.join()}-${length}`, () => {
    const parts = [placed(paint(new SphereGeometry(0.3, 10, 8), [1, 0.82, 0.3]), { y: -0.3 })];
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const c = colors[i % colors.length];
      const rgb = [1, 3, 5].map((j) => parseInt(c.slice(j, j + 2), 16) / 255);
      parts.push(placed(paint(new PlaneGeometry(0.1, length), rgb), {
        x: Math.cos(a) * 0.24, y: -0.5 - length / 2, z: Math.sin(a) * 0.24, rotY: -a,
      }));
    }
    return assemble(parts);
  });
}
