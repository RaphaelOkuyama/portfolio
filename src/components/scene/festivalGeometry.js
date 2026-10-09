import {
  BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, DataTexture, Float32BufferAttribute, LinearFilter,
  LinearMipmapLinearFilter, Quaternion, RGBAFormat, RingGeometry, SphereGeometry, TorusGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { assemble, paint, placed, shadeOnto } from './lowpoly';

// 祭り: máscaras de festival (お面), leques (扇子 e 団扇) e a barraca que as vende (お面屋). Low-poly
// como o resto da cena: as cores vêm pintadas nos vértices (o material só escurece à noite).
// Máscaras: rosto voltado para +z, centro em (0, 0, 0), ~1 de altura. Em cache

const memo = new Map();
const cached = (key, build) => {
  if (!memo.has(key)) memo.set(key, build());
  return memo.get(key);
};

const box = (w, h, d, color, at) => placed(paint(new BoxGeometry(w, h, d), color), at);
const cyl = (top, bottom, h, sides, color, at) => placed(paint(new CylinderGeometry(top, bottom, h, sides), color), at);
const cone = (r, h, sides, color, at) => placed(paint(new ConeGeometry(r, h, sides), color), at);
const ball = (r, scale, color, at) => {
  const g = paint(new SphereGeometry(r, r < 0.1 ? 7 : 10, r < 0.1 ? 5 : 8), color);
  g.scale(...scale);
  return placed(g, at);
};
// Cone deitado apontando para a frente (+z), como um nariz ou um focinho
const snout = (r, h, color, at) => cone(r, h, 6, color, { ...at, rotX: Math.PI / 2 + (at.tilt ?? 0) });

const C = {
  red: [0.78, 0.13, 0.1],
  deepRed: [0.6, 0.08, 0.07],
  white: [0.96, 0.94, 0.9],
  black: [0.08, 0.07, 0.08],
  gold: [0.93, 0.72, 0.22],
  skin: [0.94, 0.8, 0.62],
  indigo: [0.17, 0.24, 0.45],
  bone: [0.95, 0.9, 0.74],
  wood: [0.42, 0.27, 0.16],
  darkWood: [0.26, 0.17, 0.1],
  paper: [0.97, 0.93, 0.84],
  green: [0.2, 0.42, 0.3],
};

// Rosto das máscaras: a frente de um elipsoide (casca), esculpida e pintada. Em coordenadas
// normalizadas (u, v) de -1 a 1 na largura e na altura: `sculpt(u, v)` soma relevo em z
// (sobrancelha, bochecha, focinho) e `color(u, v)` pinta cada vértice (olhos, marcas, cabelo),
// como a tinta sobre o papel machê. `at(u, v, dz)` dá o ponto da superfície para encaixar peças
const gauss = (u, v, cu, cv, ru, rv) => Math.exp(-(((u - cu) / ru) ** 2) - (((v - cv) / rv) ** 2));
function inEllipse(u, v, cu, cv, ru, rv, rot = 0) {
  const dx = u - cu;
  const dy = v - cv;
  const x = dx * Math.cos(rot) + dy * Math.sin(rot);
  const y = -dx * Math.sin(rot) + dy * Math.cos(rot);
  return (x / ru) ** 2 + (y / rv) ** 2 <= 1;
}
const mix = (a, b, t) => a.map((c, i) => c + (b[i] - c) * t);
const shadeRim = (rgb, u, v, amount = 0.28) => {
  const r = Math.hypot(u, v);
  return rgb.map((c) => c * (1 - amount * Math.max(0, r - 0.55) / 0.45));
};

// Atlas da pintura das máscaras: 4 × 2 ladrilhos de TILE px, um por máscara, e o último branco
// (as peças coladas apontam para ele e ficam só com a cor dos vértices)
const TILE = 256;
const ATLAS = { cols: 4, rows: 2 };
const TILES = { tengu: 0, kitsune: 1, oni: 2, okame: 3, hyottoko: 4 };
const WHITE_TILE = 7;
const MASK_PAINT = {};
const tileUV = (tile, u, v) => [
  ((tile % ATLAS.cols) + (u + 1) / 2) / ATLAS.cols,
  (Math.floor(tile / ATLAS.cols) + (v + 1) / 2) / ATLAS.rows,
];

function maskFace({ kind, w, h, depth, sculpt = () => 0, color }) {
  MASK_PAINT[kind] = color;
  const g = new SphereGeometry(0.5, 20, 16, 0, Math.PI);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const lift = (u, v) => Math.sqrt(Math.max(0, 1 - u * u - v * v));
  for (let i = 0; i < pos.count; i += 1) {
    const u = pos.getX(i) / 0.5;
    const v = pos.getY(i) / 0.5;
    const k = lift(u, v);
    pos.setXYZ(i, (u * w) / 2, (v * h) / 2, k * depth + sculpt(u, v) * k);
    uv.setXY(i, ...tileUV(TILES[kind], u, v));
  }
  paint(g);
  g.userData.face = true;
  const at = (u, v, dz = 0) => ({ x: (u * w) / 2, y: (v * h) / 2, z: lift(u, v) * (depth + sculpt(u, v)) + dz });
  return { geometry: g, at };
}

// Junta o rosto (com a UV do seu ladrilho) e as peças (UV no ladrilho branco) e sombreia
function assembleMask(pieces) {
  const white = tileUV(WHITE_TILE, 0, 0);
  return shadeOnto(mergeGeometries(pieces.map((p) => {
    const { face } = p.userData;
    const flat = p.index ? p.toNonIndexed() : p;
    flat.deleteAttribute('normal');
    if (!face) {
      flat.setAttribute('uv', new Float32BufferAttribute(new Float32Array(flat.attributes.position.count * 2).map((_, i) => white[i % 2]), 2));
    }
    return flat;
  })));
}

// A textura do atlas, pintada pelas funções de cor de cada máscara (em cache). Sem imagem para
// baixar: os pixels são calculados aqui, ~1 MB de memória de GPU
let atlas = null;
export function maskTexture() {
  if (atlas) return atlas;
  Object.keys(TILES).forEach((kind) => maskGeometry(kind));
  const width = TILE * ATLAS.cols;
  const height = TILE * ATLAS.rows;
  const data = new Uint8Array(width * height * 4).fill(255);
  for (const [kind, tile] of Object.entries(TILES)) {
    const ox = (tile % ATLAS.cols) * TILE;
    const oy = Math.floor(tile / ATLAS.cols) * TILE;
    for (let py = 0; py < TILE; py += 1) {
      for (let px = 0; px < TILE; px += 1) {
        const rgb = MASK_PAINT[kind](((px + 0.5) / TILE) * 2 - 1, ((py + 0.5) / TILE) * 2 - 1);
        const i = ((oy + py) * width + ox + px) * 4;
        data[i] = rgb[0] * 255;
        data[i + 1] = rgb[1] * 255;
        data[i + 2] = rgb[2] * 255;
      }
    }
  }
  atlas = new DataTexture(data, width, height, RGBAFormat);
  atlas.magFilter = LinearFilter;
  atlas.minFilter = LinearMipmapLinearFilter;
  atlas.generateMipmaps = true;
  atlas.needsUpdate = true;
  return atlas;
}

// Peça ao longo de uma direção: cilindro afinando de `r0` a `r1`, saindo de `from` para `dir`
function spike(r0, r1, length, color, from, dir, sides = 8) {
  const g = paint(new CylinderGeometry(r1, r0, length, sides), color);
  g.translate(0, length / 2, 0);
  const d = new Vector3(...dir).normalize();
  g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d));
  g.translate(from.x, from.y, from.z);
  return g;
}

// 天狗 tengu: laca vermelha, o nariz comprido curvado para cima, olhos dourados de raiva sob as
// sobrancelhas brancas em tufos, bigode e a barba longa
function tengu() {
  const { geometry, at } = maskFace({
    kind: 'tengu', w: 0.62, h: 0.84, depth: 0.22,
    sculpt: (u, v) => 0.07 * gauss(u, v, 0, 0.2, 0.75, 0.12) + 0.04 * gauss(Math.abs(u), v, 0.45, -0.15, 0.2, 0.2),
    color: (u, v) => {
      for (const s of [-1, 1]) {
        if (inEllipse(u, v, s * 0.3, 0.04, 0.06, 0.06)) return C.black;
        if (inEllipse(u, v, s * 0.3, 0.04, 0.19, 0.1, s * 0.3)) return C.gold;
        if (inEllipse(u, v, s * 0.3, 0.04, 0.24, 0.14, s * 0.3)) return C.black;
      }
      if (inEllipse(u, v, 0, -0.5, 0.28, 0.06)) return C.black;
      return shadeRim(C.red, u, v);
    },
  });
  const parts = [geometry];
  // Nariz: dois lances afinando, o segundo mais empinado
  const base = at(0, -0.05, -0.02);
  const d1 = new Vector3(0, 0.45, 1).normalize();
  parts.push(spike(0.09, 0.058, 0.32, C.red, base, d1.toArray()));
  parts.push(spike(0.058, 0.018, 0.3, C.red, { x: 0, y: base.y + d1.y * 0.31, z: base.z + d1.z * 0.31 }, [0, 1.1, 1]));
  // Sobrancelhas em tufos, subindo para fora (a raiva)
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      const p = at(s * (0.14 + i * 0.12), 0.24 + i * 0.05, 0.02);
      parts.push(ball(0.05 - i * 0.004, [1.4, 0.8, 0.8], C.white, { ...p, rotZ: s * 0.4 }));
    }
    // Bigode varrendo para os lados
    for (let i = 0; i < 3; i += 1) {
      const p = at(s * (0.12 + i * 0.15), -0.3 - i * 0.03, 0.03);
      parts.push(ball(0.05, [1.6, 0.7, 0.7], C.white, { ...p, rotZ: -s * (0.2 + i * 0.25) }));
    }
  }
  // Barba: mechas longas caindo do queixo
  for (const [u, len] of [[-0.18, 0.3], [0, 0.4], [0.18, 0.3]]) {
    const p = at(u, -0.82, 0);
    parts.push(spike(0.06, 0.012, len, C.white, { x: p.x, y: p.y + 0.06, z: p.z + 0.02 }, [u * 0.6, -1, 0.15], 6));
  }
  return parts;
}

// 狐 kitsune: branca, focinho esculpido, olhos rasgados delineados de vermelho, a chama (宝珠)
// na testa, bigodes em pontos e as orelhas com o miolo vermelho
function kitsune() {
  const { geometry, at } = maskFace({
    kind: 'kitsune', w: 0.6, h: 0.76, depth: 0.2,
    sculpt: (u, v) => 0.2 * gauss(u, v, 0, -0.32, 0.3, 0.4) + 0.03 * gauss(u, v, 0, 0.2, 0.6, 0.15),
    color: (u, v) => {
      for (const s of [-1, 1]) {
        if (inEllipse(u, v, s * 0.3, 0.12, 0.17, 0.035, s * 0.4)) return C.black;
        if (inEllipse(u, v, s * 0.3, 0.13, 0.25, 0.08, s * 0.4)) return C.red;
        if (inEllipse(u, v, s * 0.24, 0.36, 0.1, 0.035, s * 0.6)) return C.red;
        for (const [du, dv] of [[0.2, -0.32], [0.28, -0.42], [0.2, -0.5]]) {
          if (inEllipse(u, v, s * du, dv, 0.025, 0.025)) return C.red;
        }
      }
      // A chama na testa: gota vermelha com o miolo dourado
      if (inEllipse(u, v, 0, 0.52, 0.035, 0.08)) return C.gold;
      if (inEllipse(u, v, 0, 0.5, 0.08, 0.18)) return C.red;
      // A boca: o traço vermelho sob o focinho
      if (v < -0.62 && v > -0.68 && Math.abs(u) < 0.16) return C.red;
      return shadeRim(C.white, u, v, 0.18);
    },
  });
  const parts = [geometry, ball(0.04, [1.3, 0.9, 1], C.black, at(0, -0.36, 0.01))];
  for (const s of [-1, 1]) {
    const p = at(s * 0.55, 0.78, -0.02);
    const ear = paint(new ConeGeometry(0.13, 0.34, 4), C.white);
    ear.scale(1, 1, 0.45);
    parts.push(placed(ear, { x: p.x, y: p.y + 0.12, z: p.z, rotZ: -s * 0.3 }));
    const inner = paint(new ConeGeometry(0.07, 0.22, 4), C.red);
    inner.scale(1, 1, 0.4);
    parts.push(placed(inner, { x: p.x - s * 0.006, y: p.y + 0.1, z: p.z + 0.035, rotZ: -s * 0.3 }));
  }
  return parts;
}

// 鬼 oni: vermelho escuro, testa e nariz salientes, olhos dourados arregalados, sobrancelhas
// grossas, a bocarra com os dentes e as presas, chifres curvos e o cabelo preto revolto
function oni() {
  const { geometry, at } = maskFace({
    kind: 'oni', w: 0.72, h: 0.84, depth: 0.22,
    sculpt: (u, v) => 0.09 * gauss(u, v, 0, 0.22, 0.8, 0.12) + 0.11 * gauss(u, v, 0, -0.08, 0.16, 0.18)
      + 0.05 * gauss(Math.abs(u), v, 0.42, -0.2, 0.2, 0.2) - 0.05 * gauss(u, v, 0, -0.5, 0.35, 0.1),
    color: (u, v) => {
      for (const s of [-1, 1]) {
        if (inEllipse(u, v, s * 0.28, 0.04, 0.07, 0.07)) return C.black;
        if (inEllipse(u, v, s * 0.28, 0.04, 0.17, 0.14)) return C.gold;
        if (inEllipse(u, v, s * 0.3, 0.3, 0.26, 0.06, s * 0.45)) return C.black;
        if (inEllipse(u, v, s * 0.1, -0.2, 0.05, 0.035, s * 0.4)) return C.black;
      }
      if (inEllipse(u, v, 0, -0.52, 0.42, 0.14)) return v > -0.47 ? C.white : [0.15, 0.04, 0.05];
      if (v > 0.66 - 0.15 * Math.abs(u)) return C.black;
      return shadeRim(mix(C.deepRed, C.red, 0.4 * (1 - Math.hypot(u, v))), u, v, 0.35);
    },
  });
  const parts = [geometry];
  for (const s of [-1, 1]) {
    // Chifre em dois lances, abrindo para fora, com anéis
    const p = at(s * 0.4, 0.62, -0.02);
    parts.push(spike(0.075, 0.055, 0.17, C.bone, p, [s * 0.25, 1, 0.1]));
    parts.push(spike(0.055, 0.008, 0.24, C.bone, { x: p.x + s * 0.042, y: p.y + 0.165, z: p.z + 0.017 }, [s * 0.7, 1, 0.2]));
    parts.push(placed(paint(new TorusGeometry(0.068, 0.012, 3, 10), C.wood), { x: p.x + s * 0.02, y: p.y + 0.08, z: p.z + 0.01, rotX: Math.PI / 2 }));
    // Presas de baixo subindo e de cima descendo
    const low = at(s * 0.26, -0.6, 0.01);
    parts.push(spike(0.03, 0.004, 0.12, C.white, low, [0, 1, 0.3], 5));
    const up = at(s * 0.12, -0.44, 0.01);
    parts.push(spike(0.025, 0.004, 0.09, C.white, up, [0, -1, 0.3], 5));
  }
  // Cabelo revolto: tufos pretos em leque no alto
  for (let i = 0; i < 7; i += 1) {
    const u = -0.6 + i * 0.2;
    const p = at(u, 0.82 - Math.abs(u) * 0.2, -0.05);
    parts.push(spike(0.07, 0.01, 0.2 + (i % 2) * 0.06, C.black, p, [u * 0.8, 1, -0.2], 5));
  }
  return parts;
}

// おかめ okame: branca, bochechas cheias e rosadas, o cabelo preto repartido no meio, as
// sobrancelhas pintadas no alto da testa (眉), olhos sorrindo e a boquinha vermelha
function okame() {
  const { geometry, at } = maskFace({
    kind: 'okame', w: 0.7, h: 0.8, depth: 0.2,
    sculpt: (u, v) => 0.13 * gauss(Math.abs(u), v, 0.42, -0.25, 0.28, 0.3) + 0.03 * gauss(u, v, 0, -0.1, 0.1, 0.12)
      + 0.03 * gauss(u, v, 0, 0.4, 0.5, 0.25),
    color: (u, v) => {
      if (v > 0.74 - 0.3 * Math.abs(u) && Math.abs(u) > 0.03) return C.black;
      for (const s of [-1, 1]) {
        if (inEllipse(u, v, s * 0.22, 0.46, 0.09, 0.05)) return C.black;
        const d = Math.hypot(u - s * 0.25, v - 0.02);
        if (d > 0.1 && d < 0.14 && v > 0.04) return C.black;
      }
      if (inEllipse(u, v, 0, -0.45, 0.09, 0.06)) return C.red;
      const blush = Math.max(gauss(u, v, -0.45, -0.28, 0.2, 0.17), gauss(u, v, 0.45, -0.28, 0.2, 0.17));
      return shadeRim(mix([0.98, 0.96, 0.92], [0.97, 0.58, 0.6], blush), u, v, 0.15);
    },
  });
  return [geometry, ball(0.03, [1, 0.8, 0.6], [0.98, 0.94, 0.9], at(0, -0.12, 0))];
}

// ひょっとこ hyottoko: pele queimada de sol, um olho arregalado e o outro miúdo, sobrancelhas
// desencontradas, a boca em bico torta para o lado e o lenço (手ぬぐい) de bolinhas na testa
function hyottoko() {
  const { geometry, at } = maskFace({
    kind: 'hyottoko', w: 0.6, h: 0.8, depth: 0.2,
    sculpt: (u, v) => 0.04 * gauss(Math.abs(u), v, 0.4, -0.2, 0.22, 0.22) + 0.04 * gauss(u, v, 0, 0.5, 0.8, 0.12)
      + 0.05 * gauss(u, v, 0, -0.08, 0.1, 0.15),
    color: (u, v) => {
      // Lenço índigo com bolinhas brancas
      if (v > 0.42 && v < 0.66) {
        const du = ((u * 7 + 10) % 1) - 0.5;
        const dv = ((v * 9 + 10) % 1) - 0.5;
        return Math.hypot(du, dv) < 0.2 ? C.white : C.indigo;
      }
      if (inEllipse(u, v, -0.26, 0.08, 0.055, 0.055)) return C.black;
      if (inEllipse(u, v, -0.26, 0.08, 0.14, 0.12)) return C.white;
      if (inEllipse(u, v, 0.25, 0.14, 0.035, 0.035)) return C.black;
      if (inEllipse(u, v, 0.25, 0.14, 0.08, 0.06)) return C.white;
      if (inEllipse(u, v, -0.26, 0.28, 0.17, 0.035, -0.25)) return C.black;
      if (inEllipse(u, v, 0.25, 0.27, 0.13, 0.03, 0.15)) return C.black;
      const blush = Math.max(gauss(u, v, -0.42, -0.2, 0.15, 0.13), gauss(u, v, 0.42, -0.2, 0.15, 0.13));
      return shadeRim(mix(C.skin, [0.95, 0.6, 0.5], blush * 0.6), u, v, 0.2);
    },
  });
  const mouth = at(0.16, -0.42, -0.02);
  const parts = [
    geometry,
    spike(0.085, 0.065, 0.2, C.skin, mouth, [0.35, -0.1, 1], 10),
  ];
  const tip = { x: mouth.x + 0.066, y: mouth.y - 0.019, z: mouth.z + 0.19 };
  parts.push(placed(paint(new TorusGeometry(0.055, 0.016, 5, 12), C.deepRed), { ...tip, rotY: 0.33 }));
  parts.push(placed(paint(new CircleGeometry(0.045, 10), [0.2, 0.05, 0.05]), { ...tip, rotY: 0.33 }));
  // O nó do lenço do lado, com as pontas soltas
  const knot = at(0.82, 0.55, 0.02);
  parts.push(ball(0.06, [1, 0.8, 0.8], C.indigo, knot));
  parts.push(spike(0.04, 0.02, 0.16, C.indigo, knot, [1, -0.6, 0.2], 5));
  parts.push(spike(0.04, 0.02, 0.13, C.indigo, knot, [1, 0.2, 0.1], 5));
  return parts;
}

const MASKS = { tengu, kitsune, oni, okame, hyottoko };

export function maskGeometry(kind) {
  return cached(`mask-${kind}`, () => assembleMask(MASKS[kind]()));
}

// 扇子: leque aberto em meia-lua, gomos alternando claro e escuro, varetas de madeira. Raio 1,
// eixo embaixo no centro, de frente para +z
export function sensuGeometry(colors = [C.red, C.paper]) {
  return cached(`sensu-${colors.flat().join(',')}`, () => {
    const parts = [];
    const ribs = 12;
    const spread = Math.PI * 0.92;
    const start = Math.PI / 2 - spread / 2;
    for (let i = 0; i < ribs; i += 1) {
      const seg = new RingGeometry(0.32, 1, 2, 1, start + (spread * i) / ribs, spread / ribs);
      parts.push(paint(seg, colors[i % 2]));
    }
    // Varetas e o rebite
    for (let i = 0; i <= ribs; i += 2) {
      const a = start + (spread * i) / ribs;
      parts.push(box(0.025, 0.36, 0.02, C.darkWood, { x: Math.cos(a) * 0.16, y: Math.sin(a) * 0.16, z: 0.01, rotZ: a - Math.PI / 2 }));
    }
    parts.push(cyl(0.035, 0.035, 0.04, 8, C.gold, { z: 0.02, rotX: Math.PI / 2 }));
    return assemble(parts);
  });
}

// 桟橋: deque de tábuas sobre estacas, onde a barraca fica quando a margem está debaixo d'água
export function deckGeometry() {
  return cached('deck', () => {
    const parts = [];
    for (let i = 0; i < 8; i += 1) {
      parts.push(box(3.3, 0.1, 0.33, i % 2 ? C.wood : C.darkWood, { y: -0.05, z: -1.2 + i * 0.34 }));
    }
    for (const x of [-1.5, 1.5]) {
      for (const z of [-1.15, 1.15]) parts.push(box(0.14, 1.4, 0.14, C.darkWood, { x, y: -0.75, z }));
    }
    return assemble(parts);
  });
}

// 団扇: leque redondo com cabo, o sol vermelho (日の丸) no papel claro
export function uchiwaGeometry() {
  return cached('uchiwa', () => assemble([
    paint(new CircleGeometry(0.5, 16), C.paper),
    placed(paint(new CircleGeometry(0.2, 14), C.red), { z: 0.005 }),
    box(0.06, 0.55, 0.04, C.wood, { y: -0.68 }),
  ]));
}

// 提灯: lanterna de papel vermelha, com as costelas de bambu marcando os gomos, as tampas pretas
// em cima e embaixo e o gancho
export function chochinGeometry() {
  return cached('chochin', () => {
    const parts = [ball(0.5, [1, 1.3, 1], C.red, {})];
    // Costelas: anéis finos mais escuros, seguindo a curva do papel
    for (let i = 1; i < 6; i += 1) {
      const t = -1 + (i / 6) * 2;
      const r = 0.5 * Math.sqrt(1 - t * t) + 0.004;
      parts.push(placed(paint(new TorusGeometry(r, 0.012, 3, 12), C.deepRed), { y: t * 0.65, rotX: Math.PI / 2 }));
    }
    parts.push(cyl(0.28, 0.3, 0.12, 12, C.black, { y: 0.64 }));
    parts.push(cyl(0.3, 0.28, 0.12, 12, C.black, { y: -0.64 }));
    parts.push(cyl(0.015, 0.015, 0.3, 4, C.darkWood, { y: 0.85 }));
    return assemble(parts);
  });
}

// Máscaras penduradas no painel do fundo da barraca: [tipo, x, y, inclinação]. Cada uma pende
// de um cordão preso na vara de cima da sua fileira
export const STALL_MASKS = [
  ['tengu', -1.0, 2.24, 0.05], ['kitsune', -0.33, 2.26, -0.04], ['oni', 0.33, 2.24, 0.03], ['okame', 1.0, 2.26, -0.05],
  ['hyottoko', -0.98, 1.5, -0.04], ['kitsune', -0.3, 1.52, 0.06], ['oni', 1.0, 1.5, -0.03],
];
const MASK_ROD = 0.36;

// 和傘 wagasa: guarda-sol de papel vermelho, com as varetas por baixo, o anel branco e o mastro
function wagasa() {
  const parts = [cyl(0.025, 0.03, 2.5, 6, C.wood, { y: 1.25 })];
  // Copa em 16 gomos de papel, alternando o tom, e o anel branco pintado no papel
  for (let i = 0; i < 16; i += 1) {
    const wedge = new ConeGeometry(1.0, 0.42, 1, 1, true, (i / 16) * Math.PI * 2, Math.PI / 8);
    parts.push(placed(paint(wedge, i % 2 ? C.red : [0.7, 0.12, 0.09]), { y: 2.42 }));
  }
  parts.push(placed(paint(new TorusGeometry(0.6, 0.018, 3, 16), C.white), { y: 2.385, rotX: Math.PI / 2 }));
  // Varetas: do pé da copa até o anel do mastro, por baixo do papel
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    parts.push(box(0.015, 0.015, 0.95, C.darkWood, {
      x: Math.sin(a) * 0.5, y: 2.0, z: Math.cos(a) * 0.5, rotX: -0.38, rotY: a,
    }));
  }
  parts.push(cyl(0.05, 0.05, 0.12, 8, C.darkWood, { y: 2.68 }));
  return parts;
}

// お面屋: barraca de festival (屋台) de madeira. Telhado de tábuas caindo para a frente, a faixa
// de pano listrada (暖簾) no beiral, a placa no alto, o balcão com a cortina vermelha e branca
// (紅白幕) em pregas, o painel treliçado (格子) com as varas e os cordões das máscaras, caixotes de
// madeira de um lado e o guarda-sol (和傘) do outro. Frente em +z; 3 de largura
export function maskStallGeometry() {
  return cached('mask-stall', () => {
    const lightWood = [0.55, 0.37, 0.22];
    const parts = [
      // Postes e as vigas do alto
      box(0.13, 2.75, 0.13, C.darkWood, { x: -1.45, y: 1.375, z: 0.6 }),
      box(0.13, 2.75, 0.13, C.darkWood, { x: 1.45, y: 1.375, z: 0.6 }),
      box(0.13, 3.05, 0.13, C.darkWood, { x: -1.45, y: 1.525, z: -0.6 }),
      box(0.13, 3.05, 0.13, C.darkWood, { x: 1.45, y: 1.525, z: -0.6 }),
      box(3.05, 0.12, 0.12, C.wood, { y: 2.7, z: 0.6 }),
      box(3.05, 0.12, 0.12, C.wood, { y: 3.0, z: -0.6 }),
      box(0.1, 0.1, 1.3, C.wood, { x: -1.45, y: 2.86, rotX: 0.23 }),
      box(0.1, 0.1, 1.3, C.wood, { x: 1.45, y: 2.86, rotX: 0.23 }),
      // Cumeeira atrás
      box(3.55, 0.1, 0.16, C.darkWood, { y: 3.13, z: -0.74 }),
    ];
    // Telhado: tábuas lado a lado, cada uma num tom, e as ripas por cima
    for (let i = 0; i < 9; i += 1) {
      const tone = [C.wood, lightWood, C.darkWood][i % 3];
      parts.push(box(0.385, 0.06, 1.9, tone, { x: -1.54 + i * 0.385, y: 2.92, z: 0.12, rotX: 0.2 }));
    }
    for (const x of [-1.1, 0, 1.1]) parts.push(box(0.06, 0.05, 1.92, C.darkWood, { x, y: 2.97, z: 0.12, rotX: 0.2 }));

    // 暖簾: a faixa listrada pendurada no beiral, com a barra escura em cima e os cortes (pano
    // dividido) de comprimentos alternados, cada gomo levemente torto como pano
    parts.push(box(3.3, 0.09, 0.04, C.indigo, { y: 2.68, z: 1.0 }));
    for (let i = 0; i < 11; i += 1) {
      const h = i % 2 ? 0.24 : 0.29;
      parts.push(box(0.29, h, 0.025, i % 2 ? C.white : C.red, {
        x: -1.5 + i * 0.3, y: 2.64 - h / 2, z: 1.0, rotY: ((i * 7) % 3 - 1) * 0.05,
      }));
    }

    // 看板: a placa no alto do telhado, com moldura, o papel claro e o círculo vermelho
    parts.push(box(0.06, 0.4, 0.06, C.darkWood, { x: -0.5, y: 3.18, z: -0.4 }));
    parts.push(box(0.06, 0.4, 0.06, C.darkWood, { x: 0.5, y: 3.18, z: -0.4 }));
    parts.push(box(1.4, 0.52, 0.05, C.darkWood, { y: 3.5, z: -0.4 }));
    parts.push(box(1.28, 0.42, 0.04, C.paper, { y: 3.5, z: -0.37 }));
    parts.push(placed(paint(new CircleGeometry(0.15, 14), C.red), { x: -0.38, y: 3.5, z: -0.345 }));
    // 面 em pinceladas: o traço de cima, o pingo, a moldura e as duas colunas com as travessas
    const ink = (w, h, x, y) => parts.push(box(w, h, 0.02, C.black, { x: 0.22 + x, y: 3.5 + y, z: -0.345 }));
    ink(0.34, 0.035, 0, 0.16);
    ink(0.035, 0.05, -0.03, 0.12);
    ink(0.035, 0.24, -0.13, -0.03); ink(0.035, 0.24, 0.13, -0.03);
    ink(0.26, 0.03, 0, 0.09); ink(0.26, 0.03, 0, -0.15);
    ink(0.025, 0.22, -0.045, -0.03); ink(0.025, 0.22, 0.045, -0.03);
    ink(0.09, 0.022, 0, 0.02); ink(0.09, 0.022, 0, -0.07);

    // Balcão: corpo, tampo de tábua com a borda, e a cortina 紅白 em pregas na frente
    parts.push(box(3.0, 0.82, 0.85, C.darkWood, { y: 0.41, z: 0.25 }));
    parts.push(box(3.2, 0.08, 1.02, lightWood, { y: 0.86, z: 0.27 }));
    parts.push(box(3.2, 0.06, 0.06, C.darkWood, { y: 0.81, z: 0.79 }));
    for (let i = 0; i < 12; i += 1) {
      parts.push(box(0.26, 0.66, 0.02, i % 2 ? C.white : C.red, {
        x: -1.375 + i * 0.25, y: 0.42, z: 0.7, rotY: i % 2 ? 0.12 : -0.12,
      }));
    }
    parts.push(box(3.05, 0.06, 0.04, C.deepRed, { y: 0.76, z: 0.72 }));

    // Painel do fundo com a treliça e as varas das máscaras, cada máscara no seu cordão
    parts.push(box(2.9, 1.9, 0.06, C.darkWood, { y: 1.95, z: -0.62 }));
    for (let i = 0; i < 7; i += 1) parts.push(box(0.04, 1.9, 0.03, lightWood, { x: -1.44 + i * 0.48, y: 1.95, z: -0.58 }));
    for (const y of [1.2, 1.95, 2.7]) parts.push(box(2.9, 0.04, 0.03, lightWood, { y, z: -0.58 }));
    for (const y of [2.25 + MASK_ROD, 1.51 + MASK_ROD]) parts.push(cyl(0.022, 0.022, 2.7, 6, C.gold, { y, z: -0.52, rotZ: Math.PI / 2 }));
    STALL_MASKS.forEach(([, x, y]) => {
      const top = y + 0.24;
      const rod = (y > 2 ? 2.25 : 1.51) + MASK_ROD;
      parts.push(box(0.012, rod - top, 0.012, C.black, { x, y: (rod + top) / 2, z: -0.5 }));
    });

    // Caixotes de madeira empilhados do lado esquerdo, com as ripas
    for (const [x, y, z, s] of [[-1.95, 0.22, 0.2, 1], [-1.95, 0.22, -0.4, 1], [-1.95, 0.64, -0.1, 0.85]]) {
      parts.push(box(0.6 * s, 0.42 * s, 0.55 * s, C.wood, { x, y, z }));
      for (const dy of [-0.12, 0.04]) parts.push(box(0.62 * s, 0.05 * s, 0.57 * s, C.darkWood, { x, y: y + dy * s, z }));
    }
    // O guarda-sol do lado direito
    wagasa().forEach((g) => parts.push(placed(g, { x: 2.15, z: 0.35 })));
    return assemble(parts);
  });
}

// 掛額: painel de madeira com a corda sagrada (注連縄) em cima, onde fica o tengu grande
export function maskBoardGeometry() {
  return cached('mask-board', () => assemble([
    box(0.12, 3.2, 0.12, C.wood, { x: -0.85, y: 1.6 }),
    box(0.12, 3.2, 0.12, C.wood, { x: 0.85, y: 1.6 }),
    box(1.9, 1.7, 0.1, C.darkWood, { y: 2.1, z: -0.06 }),
    box(2.1, 0.1, 0.25, C.wood, { y: 3.0 }),
    cyl(0.07, 0.07, 2.0, 6, C.paper, { y: 2.88, z: 0.12, rotZ: Math.PI / 2 }),
  ]));
}
