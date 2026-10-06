import { BoxGeometry, ConeGeometry, CylinderGeometry, DodecahedronGeometry, SphereGeometry, Vector3 } from 'three';
import { assemble, paint, placed } from './lowpoly';
import { segment } from './tanabataGeometry';
import { mulberry32 } from '../../lib/journey/ridge';

// 盆栽: pinheiro negro (黒松) em estilo moyōgi (tronco em S) num vaso raso esmaltado, sobre uma
// mesinha baixa (卓). Low-poly com as cores nos vértices; base na origem, ~1.6 de altura.
// Devolve { wood, foliage } (as almofadas de agulhas balançam separadas). Em cache

let cache = null;

const C = {
  stand: [0.3, 0.19, 0.12],
  standDark: [0.2, 0.12, 0.08],
  pot: [0.2, 0.29, 0.44],
  potRim: [0.26, 0.36, 0.52],
  soil: [0.24, 0.18, 0.13],
  moss: [0.36, 0.52, 0.24],
  rock: [0.55, 0.55, 0.52],
  bark: [0.36, 0.27, 0.22],
  barkDark: [0.26, 0.19, 0.16],
  needleDark: [0.12, 0.28, 0.2],
  needle: [0.2, 0.4, 0.26],
  needleTip: [0.34, 0.52, 0.3],
};

const box = (w, h, d, color, at) => placed(paint(new BoxGeometry(w, h, d), color), at);

// Tronco/galho afinando por uma linha de pontos, com uma esfera em cada junta (sem frestas)
function limb(points, r0, r1, color) {
  const parts = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const r = r0 + (r1 - r0) * (i / (points.length - 1));
    const g = segment(points[i], points[i + 1], r, 7);
    parts.push(paint(g, color));
    if (i > 0) parts.push(placed(paint(new SphereGeometry(r, 7, 5), color), points[i]));
  }
  return parts;
}

// Almofada de agulhas: vários poliedros achatados, escuros embaixo e claros em cima
function pad(center, size, rand) {
  const parts = [];
  const n = 6;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.6;
    const d = size * (0.35 + rand() * 0.35);
    const r = size * (0.5 + rand() * 0.2);
    const g = new DodecahedronGeometry(r, 0);
    g.scale(1, 0.5, 1);
    g.rotateY(rand() * Math.PI);
    parts.push(placed(paint(g, C.needleDark), { x: center.x + Math.cos(a) * d, y: center.y - 0.02, z: center.z + Math.sin(a) * d * 0.8 }));
  }
  // A camada de cima, mais clara, com uns tufos ainda mais claros (os brotos)
  const top = new DodecahedronGeometry(size * 0.62, 0);
  top.scale(1.25, 0.38, 1.05);
  parts.push(placed(paint(top, C.needle), { x: center.x, y: center.y + size * 0.12, z: center.z }));
  for (let i = 0; i < 3; i += 1) {
    const a = rand() * Math.PI * 2;
    const g = new DodecahedronGeometry(size * 0.22, 0);
    g.scale(1, 0.5, 1);
    parts.push(placed(paint(g, C.needleTip), {
      x: center.x + Math.cos(a) * size * 0.45, y: center.y + size * 0.2, z: center.z + Math.sin(a) * size * 0.4,
    }));
  }
  return parts;
}

export function bonsaiGeometry() {
  if (cache) return cache;
  const rand = mulberry32(808);
  const wood = [];

  // 卓: tampo grosso com borda, quatro pés e as travessas de baixo
  const top = 0.52;
  wood.push(box(1.25, 0.08, 0.78, C.stand, { y: top }));
  wood.push(box(1.29, 0.03, 0.82, C.standDark, { y: top - 0.055 }));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    wood.push(box(0.08, top - 0.07, 0.08, C.standDark, { x: sx * 0.54, y: (top - 0.07) / 2, z: sz * 0.31 }));
  });
  wood.push(box(1.1, 0.04, 0.05, C.standDark, { y: 0.1, z: 0.31 }), box(1.1, 0.04, 0.05, C.standDark, { y: 0.1, z: -0.31 }));

  // Vaso raso retangular, esmaltado de azul, com borda e pezinhos
  const base = top + 0.04;
  wood.push(...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => box(0.07, 0.04, 0.07, C.potRim, { x: sx * 0.36, y: base + 0.02, z: sz * 0.2 })));
  const pot = new CylinderGeometry(0.62, 0.52, 0.17, 4, 1);
  pot.rotateY(Math.PI / 4);
  pot.scale(1, 1, 0.62);
  wood.push(placed(paint(pot, C.pot), { y: base + 0.04 + 0.085 }));
  const rim = new CylinderGeometry(0.64, 0.64, 0.03, 4, 1);
  rim.rotateY(Math.PI / 4);
  rim.scale(1, 1, 0.62);
  const potTop = base + 0.04 + 0.17;
  wood.push(placed(paint(rim, C.potRim), { y: potTop }));
  // Terra, musgo e uma pedrinha
  const soil = new CylinderGeometry(0.58, 0.58, 0.03, 4, 1);
  soil.rotateY(Math.PI / 4);
  soil.scale(1, 1, 0.6);
  wood.push(placed(paint(soil, C.soil), { y: potTop + 0.01 }));
  for (let i = 0; i < 7; i += 1) {
    const g = new SphereGeometry(0.05 + rand() * 0.04, 6, 4);
    g.scale(1.4, 0.35, 1.2);
    wood.push(placed(paint(g, C.moss), { x: -0.35 + rand() * 0.7, y: potTop + 0.025, z: -0.15 + rand() * 0.3 }));
  }
  const rock = new DodecahedronGeometry(0.07, 0);
  rock.scale(1.3, 0.7, 1);
  wood.push(placed(paint(rock, C.rock), { x: 0.28, y: potTop + 0.04, z: 0.08 }));

  // Tronco em S, saindo um pouco à esquerda do centro (o lado vazio equilibra a copa)
  const ground = potTop + 0.02;
  const P = (x, y, z) => new Vector3(x, ground + y, z);
  const trunk = [P(-0.14, 0, 0), P(-0.04, 0.16, 0.03), P(-0.16, 0.34, -0.02), P(-0.02, 0.52, 0.04), P(-0.12, 0.7, 0), P(-0.04, 0.84, 0.02)];
  wood.push(...limb(trunk, 0.095, 0.035, C.bark));
  // Nebari: as raízes abrindo na terra
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    wood.push(...limb([P(-0.14, 0.05, 0), P(-0.14 + Math.cos(a) * 0.16, 0.0, Math.sin(a) * 0.1)], 0.035, 0.012, C.barkDark));
  }
  const rootFlare = new ConeGeometry(0.11, 0.1, 7);
  wood.push(placed(paint(rootFlare, C.barkDark), { x: -0.14, y: ground + 0.04 }));

  // Galhos: cada um sai do tronco, vai para fora quase na horizontal e termina numa almofada
  const branches = [
    { from: trunk[1], to: [P(0.22, 0.2, 0.05), P(0.42, 0.24, 0.08)], size: 0.26 },
    { from: trunk[2], to: [P(-0.36, 0.38, -0.04), P(-0.52, 0.42, -0.02)], size: 0.22 },
    { from: trunk[3], to: [P(0.16, 0.56, -0.08), P(0.32, 0.6, -0.1)], size: 0.2 },
    { from: trunk[4], to: [P(-0.3, 0.72, 0.06)], size: 0.16 },
  ];
  const foliage = [];
  branches.forEach((b) => {
    const pts = [b.from, ...b.to];
    wood.push(...limb(pts, 0.036, 0.016, C.bark));
    const end = pts[pts.length - 1];
    foliage.push(...pad(new Vector3(end.x, end.y + 0.04, end.z), b.size * 1.3, rand));
  });
  // Ápice: a copa do alto, mais redonda
  foliage.push(...pad(new Vector3(-0.04, ground + 0.92, 0.02), 0.3, rand));

  cache = { wood: assemble(wood), foliage: assemble(foliage) };
  return cache;
}
