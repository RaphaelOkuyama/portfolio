import {
  BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, RingGeometry, SphereGeometry,
} from 'three';
import { assemble, paint, placed } from './lowpoly';

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
  const g = paint(new SphereGeometry(r, 10, 8), color);
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

// Rosto base: elipsoide achatado (só a frente aparece, o verso encosta no painel)
const face = (color, w = 0.62, h = 0.82) => ball(0.5, [w, h, 0.42], color, {});

// 天狗 tengu: vermelho, nariz comprido, sobrancelhas e barba brancas, olhos dourados
function tengu() {
  return [
    face(C.red),
    snout(0.075, 0.62, C.red, { y: 0.02, z: 0.47, tilt: -0.22 }),
    ball(0.06, [1.3, 0.8, 0.6], C.gold, { x: -0.13, y: 0.12, z: 0.18 }),
    ball(0.06, [1.3, 0.8, 0.6], C.gold, { x: 0.13, y: 0.12, z: 0.18 }),
    box(0.2, 0.05, 0.06, C.white, { x: -0.14, y: 0.22, z: 0.18, rotZ: 0.35 }),
    box(0.2, 0.05, 0.06, C.white, { x: 0.14, y: 0.22, z: 0.18, rotZ: -0.35 }),
    // Bigode e barba
    box(0.36, 0.05, 0.05, C.white, { y: -0.17, z: 0.18 }),
    cone(0.14, 0.32, 5, C.white, { y: -0.42, z: 0.1, rotX: Math.PI }),
  ];
}

// 狐 kitsune: branca, orelhas em ponta, focinho curto e as marcas vermelhas
function kitsune() {
  return [
    face(C.white, 0.6, 0.72),
    snout(0.13, 0.3, C.white, { y: -0.1, z: 0.28, tilt: 0.08 }),
    ball(0.035, [1, 1, 1], C.black, { y: -0.1, z: 0.44 }),
    cone(0.11, 0.3, 4, C.white, { x: -0.19, y: 0.38, z: -0.02, rotZ: 0.25 }),
    cone(0.11, 0.3, 4, C.white, { x: 0.19, y: 0.38, z: -0.02, rotZ: -0.25 }),
    cone(0.06, 0.18, 4, C.red, { x: -0.19, y: 0.37, z: 0.04, rotZ: 0.25 }),
    cone(0.06, 0.18, 4, C.red, { x: 0.19, y: 0.37, z: 0.04, rotZ: -0.25 }),
    // Olhos rasgados e as pinturas vermelhas acima deles
    box(0.13, 0.025, 0.04, C.black, { x: -0.12, y: 0.07, z: 0.19, rotZ: -0.3 }),
    box(0.13, 0.025, 0.04, C.black, { x: 0.12, y: 0.07, z: 0.19, rotZ: 0.3 }),
    box(0.12, 0.035, 0.04, C.red, { x: -0.12, y: 0.15, z: 0.18, rotZ: -0.45 }),
    box(0.12, 0.035, 0.04, C.red, { x: 0.12, y: 0.15, z: 0.18, rotZ: 0.45 }),
    box(0.035, 0.12, 0.04, C.red, { y: 0.24, z: 0.17 }),
  ];
}

// 鬼 oni: vermelho escuro, chifres, olhos dourados arregalados e presas
function oni() {
  return [
    face(C.deepRed, 0.7, 0.8),
    cone(0.07, 0.3, 5, C.bone, { x: -0.18, y: 0.43, z: 0.02, rotZ: 0.3 }),
    cone(0.07, 0.3, 5, C.bone, { x: 0.18, y: 0.43, z: 0.02, rotZ: -0.3 }),
    ball(0.075, [1.2, 1, 0.6], C.gold, { x: -0.14, y: 0.1, z: 0.18 }),
    ball(0.075, [1.2, 1, 0.6], C.gold, { x: 0.14, y: 0.1, z: 0.18 }),
    ball(0.03, [1, 1, 1], C.black, { x: -0.14, y: 0.1, z: 0.22 }),
    ball(0.03, [1, 1, 1], C.black, { x: 0.14, y: 0.1, z: 0.22 }),
    box(0.22, 0.06, 0.06, C.black, { x: -0.15, y: 0.22, z: 0.17, rotZ: -0.4 }),
    box(0.22, 0.06, 0.06, C.black, { x: 0.15, y: 0.22, z: 0.17, rotZ: 0.4 }),
    snout(0.07, 0.12, C.deepRed, { y: -0.02, z: 0.22 }),
    // Boca aberta com as presas
    box(0.34, 0.1, 0.06, C.black, { y: -0.2, z: 0.17 }),
    cone(0.03, 0.12, 4, C.white, { x: -0.11, y: -0.18, z: 0.2, rotX: Math.PI }),
    cone(0.03, 0.12, 4, C.white, { x: 0.11, y: -0.18, z: 0.2, rotX: Math.PI }),
  ];
}

// おかめ okame: bochechas cheias, sobrancelhas altas, boca pequena vermelha e o cabelo preto
function okame() {
  return [
    face(C.white, 0.68, 0.8),
    ball(0.17, [1, 0.9, 0.7], C.white, { x: -0.16, y: -0.1, z: 0.1 }),
    ball(0.17, [1, 0.9, 0.7], C.white, { x: 0.16, y: -0.1, z: 0.1 }),
    box(0.62, 0.12, 0.2, C.black, { y: 0.36, z: 0.04 }),
    ball(0.04, [1.4, 0.7, 0.5], C.black, { x: -0.15, y: 0.23, z: 0.17 }),
    ball(0.04, [1.4, 0.7, 0.5], C.black, { x: 0.15, y: 0.23, z: 0.17 }),
    box(0.1, 0.022, 0.04, C.black, { x: -0.12, y: 0.07, z: 0.2, rotZ: 0.2 }),
    box(0.1, 0.022, 0.04, C.black, { x: 0.12, y: 0.07, z: 0.2, rotZ: -0.2 }),
    ball(0.035, [1.3, 0.8, 0.6], C.red, { y: -0.18, z: 0.2 }),
  ];
}

// ひょっとこ hyottoko: a boca em bico, um olho maior que o outro e o lenço (手ぬぐい) na testa
function hyottoko() {
  return [
    face(C.skin, 0.6, 0.8),
    box(0.64, 0.1, 0.3, C.indigo, { y: 0.32, z: 0.02 }),
    box(0.62, 0.025, 0.31, C.white, { y: 0.3, z: 0.02 }),
    ball(0.06, [1, 1, 0.5], C.white, { x: -0.13, y: 0.1, z: 0.18 }),
    ball(0.045, [1, 1, 0.5], C.white, { x: 0.13, y: 0.12, z: 0.18 }),
    ball(0.025, [1, 1, 1], C.black, { x: -0.12, y: 0.1, z: 0.21 }),
    ball(0.02, [1, 1, 1], C.black, { x: 0.12, y: 0.12, z: 0.2 }),
    cyl(0.07, 0.06, 0.2, 8, C.skin, { x: 0.1, y: -0.18, z: 0.23, rotX: Math.PI / 2 }),
    cyl(0.035, 0.035, 0.02, 8, C.deepRed, { x: 0.1, y: -0.18, z: 0.335, rotX: Math.PI / 2 }),
  ];
}

const MASKS = { tengu, kitsune, oni, okame, hyottoko };

export function maskGeometry(kind) {
  return cached(`mask-${kind}`, () => assemble(MASKS[kind]()));
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

// 団扇: leque redondo com cabo, o sol vermelho (日の丸) no papel claro
export function uchiwaGeometry() {
  return cached('uchiwa', () => assemble([
    paint(new CircleGeometry(0.5, 16), C.paper),
    placed(paint(new CircleGeometry(0.2, 14), C.red), { z: 0.005 }),
    box(0.06, 0.55, 0.04, C.wood, { y: -0.68 }),
  ]));
}

// 提灯: lanterna de papel vermelha com faixas pretas em cima e embaixo
export function chochinGeometry() {
  return cached('chochin', () => assemble([
    ball(0.5, [1, 1.3, 1], C.red, {}),
    cyl(0.28, 0.28, 0.1, 10, C.black, { y: 0.62 }),
    cyl(0.28, 0.28, 0.1, 10, C.black, { y: -0.62 }),
  ]));
}

// お面屋: barraca de festival (屋台) de madeira, com a faixa de pano vermelha e branca no alto, o
// painel do fundo onde as máscaras ficam penduradas e o balcão. Frente em +z; 3 de largura
export function maskStallGeometry() {
  return cached('mask-stall', () => {
    const parts = [
      // Postes, balcão e o painel do fundo
      box(0.14, 2.7, 0.14, C.wood, { x: -1.45, y: 1.35, z: 0.6 }),
      box(0.14, 2.7, 0.14, C.wood, { x: 1.45, y: 1.35, z: 0.6 }),
      box(0.14, 2.9, 0.14, C.wood, { x: -1.45, y: 1.45, z: -0.6 }),
      box(0.14, 2.9, 0.14, C.wood, { x: 1.45, y: 1.45, z: -0.6 }),
      box(3.0, 0.9, 0.9, C.darkWood, { y: 0.45, z: 0.25 }),
      box(3.1, 0.08, 1.0, C.wood, { y: 0.92, z: 0.25 }),
      box(2.9, 1.75, 0.08, C.darkWood, { y: 1.95, z: -0.62 }),
      // Telhado inclinado
      box(3.4, 0.08, 1.7, C.darkWood, { y: 2.95, z: 0.05, rotX: 0.22 }),
    ];
    // Faixa de pano (暖簾) com as listras vermelhas e brancas na frente do telhado
    for (let i = 0; i < 10; i += 1) {
      parts.push(box(0.3, 0.38, 0.03, i % 2 ? C.white : C.red, { x: -1.35 + i * 0.3, y: 2.62, z: 0.82 }));
    }
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
