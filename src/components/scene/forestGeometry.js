import { ConeGeometry, CylinderGeometry, DodecahedronGeometry, Float32BufferAttribute, OctahedronGeometry } from 'three';
import { assemble, placed } from './lowpoly';

// Árvores das cordilheiras, low-poly com a luz "pintada" nas faces (lowpoly.shadeOnto) e tons
// relativos nos vértices: a cor final vem do material da encosta (estação, dia/noite, névoa), que
// multiplica estes tons, e a árvore continua fundindo com a montanha à distância, agora com volume.
// Base na origem, ~1,5 de altura (a escala de cada instância vem do posicionamento)

let cache = null;

// Cor por vértice: `tone(y)` devolve o multiplicador (1 = tom da encosta) na altura y local
function shade(geometry, tone) {
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 1) {
    const [r, g, b] = tone(pos.getY(i), i);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
}

// Uma camada da copa: cone com a borda de baixo serrilhada (pontas de galho alternando com
// reentrâncias) e caída para fora; o pé da camada fica mais escuro (sombra da camada de cima)
function tier(radius, height, sides, light) {
  const g = new ConeGeometry(radius, height, sides, 1, false);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    if (y > -height / 2 + 1e-4) continue;
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-4) continue;
    // Ângulo do vértice no anel: pares viram ponta de galho, ímpares reentrância
    const k = Math.round(((Math.atan2(z, x) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2 / sides));
    const s = k % 2 === 0 ? 1.08 : 0.74;
    pos.setX(i, x * s);
    pos.setZ(i, z * s);
    pos.setY(i, y - (k % 2 === 0 ? 0.05 : 0));
  }
  g.computeVertexNormals();
  return shade(g, (y) => {
    const t = (y + height / 2) / height;
    const v = light * (0.72 + 0.34 * t);
    return [v * 0.97, v, v * 0.95];
  });
}

// 杉 sugi: tronco fino aparente e a copa alta em camadas que estreitam até a ponta
function sugi() {
  const parts = [];
  parts.push(placed(shade(new CylinderGeometry(0.03, 0.05, 0.42, 5), () => [0.62, 0.5, 0.42]), { y: 0.21 }));
  const tiers = 5;
  for (let i = 0; i < tiers; i += 1) {
    const r = 0.44 * (1 - i * 0.15);
    const h = 0.44 - i * 0.03;
    const bottom = 0.22 + i * 0.23;
    parts.push(placed(tier(r, h, 10, 0.86 + i * 0.05), { y: bottom + h / 2, rotY: i * 0.55 }));
  }
  // Ponta fina
  parts.push(placed(tier(0.09, 0.28, 6, 1.12), { y: 1.42 }));
  return assemble(parts);
}

// 松 matsu: tronco torto aparente e a copa em "nuvens" achatadas e escalonadas (como o bonsai),
// silhueta bem diferente do cone do sugi: quebra a repetição da floresta
function matsu() {
  const parts = [];
  const bark = () => [0.58, 0.46, 0.4];
  // Tronco em dois lances, inclinando para um lado e voltando
  parts.push(placed(shade(new CylinderGeometry(0.04, 0.065, 0.62, 5), bark), { y: 0.3, x: 0.04, rotZ: -0.16 }));
  parts.push(placed(shade(new CylinderGeometry(0.028, 0.042, 0.5, 5), bark), { y: 0.82, x: 0.06, rotZ: 0.22 }));
  // Galhos até as nuvens laterais
  parts.push(placed(shade(new CylinderGeometry(0.015, 0.025, 0.36, 4), bark), { x: -0.14, y: 0.66, rotZ: 1.1 }));
  parts.push(placed(shade(new CylinderGeometry(0.014, 0.022, 0.3, 4), bark), { x: 0.2, y: 0.9, rotZ: -1.15 }));
  // Nuvens de agulhas: [x, y, z, largura, luz]; achatadas, mais claras em cima, sombra embaixo
  const pads = [
    [-0.3, 0.7, 0.04, 0.3, 0.88], [0.34, 0.95, -0.05, 0.26, 0.94],
    [0.02, 1.16, 0.02, 0.32, 1.0], [0.06, 1.36, -0.02, 0.2, 1.08],
  ];
  pads.forEach(([x, y, z, r, light], i) => {
    const g = new DodecahedronGeometry(r, 0);
    g.scale(1.55, 0.42, 1.25);
    g.rotateY(i * 0.9);
    parts.push(placed(shade(g, (yy) => {
      const t = Math.min(1, Math.max(0, (yy + r * 0.42) / (r * 0.84)));
      const v = light * (0.62 + 0.5 * t);
      return [v * 0.96, v, v * 0.9];
    }), { x, y, z }));
  });
  return assemble(parts);
}

// Versões leves (LOD) para as árvores longe da câmera, onde a névoa já apaga o detalhe: o sugi
// com 3 camadas de 6 lados e o matsu com tronco único e 3 nuvens em losango (~1/3 dos triângulos)
function sugiLite() {
  const parts = [placed(shade(new CylinderGeometry(0.035, 0.05, 0.42, 4), () => [0.62, 0.5, 0.42]), { y: 0.21 })];
  for (let i = 0; i < 3; i += 1) {
    const r = 0.44 * (1 - i * 0.26);
    const h = 0.5 - i * 0.04;
    const bottom = 0.22 + i * 0.38;
    parts.push(placed(tier(r, h, 6, 0.86 + i * 0.09), { y: bottom + h / 2, rotY: i * 0.5 }));
  }
  return assemble(parts);
}

function matsuLite() {
  const parts = [placed(shade(new CylinderGeometry(0.035, 0.06, 1.1, 4), () => [0.58, 0.46, 0.4]), { y: 0.55, x: 0.05, rotZ: 0.05 })];
  [[-0.28, 0.72, 0.3, 0.88], [0.3, 0.98, 0.27, 0.94], [0.03, 1.22, 0.3, 1.02]].forEach(([x, y, r, light], i) => {
    const g = new OctahedronGeometry(r, 0);
    g.scale(1.6, 0.45, 1.3);
    g.rotateY(i * 0.9 + 0.4);
    parts.push(placed(shade(g, (yy) => {
      const t = Math.min(1, Math.max(0, (yy + r * 0.45) / (r * 0.9)));
      const v = light * (0.62 + 0.5 * t);
      return [v * 0.96, v, v * 0.9];
    }), { x, y }));
  });
  return assemble(parts);
}

export function forestGeometry() {
  if (!cache) cache = { sugi: sugi(), matsu: matsu(), sugiLite: sugiLite(), matsuLite: matsuLite() };
  return cache;
}

// Vento nas copas (vertex shader das árvores): a ponta balança mais, cada árvore no seu ritmo
export const TREE_SWAY = /* glsl */ `
  #ifdef USE_INSTANCING
    float swayPhase = instanceMatrix[3].x * 0.37 + instanceMatrix[3].y * 0.21;
    float bend = transformed.y * transformed.y;
    transformed.x += sin(uTime * 0.9 + swayPhase) * 0.035 * bend;
    transformed.z += cos(uTime * 0.7 + swayPhase * 1.3) * 0.02 * bend;
  #endif
`;
