import {
  BoxGeometry, BufferGeometry, CatmullRomCurve3, ConeGeometry, CylinderGeometry, DodecahedronGeometry, ExtrudeGeometry,
  Float32BufferAttribute, Shape, SphereGeometry, TubeGeometry, Vector3,
} from 'three';
import { assemble, paint, placed } from './lowpoly';

// Peças de santuário da cena, low-poly como o torii: cada função devolve geometrias com o tom de
// luz já pintado nos vértices (a cor vem do material, pela paleta). Base em y = 0, frente em +z.
// As geometrias ficam em cache: são as mesmas em toda a cena

const memo = new Map();
const cached = (key, build) => {
  if (!memo.has(key)) memo.set(key, build());
  return memo.get(key);
};

const box = (w, h, d, at) => placed(paint(new BoxGeometry(w, h, d)), at);
const cyl = (top, bottom, h, sides, at) => placed(paint(new CylinderGeometry(top, bottom, h, sides)), at);
const cone = (r, h, sides, at) => placed(paint(new ConeGeometry(r, h, sides)), at);
const lump = (r, scale, at, detail = 0) => {
  const g = paint(new DodecahedronGeometry(r, detail));
  g.scale(...scale);
  return placed(g, at);
};

// 狛犬 (komainu): o par de leões guardiões do santuário, sentados num pedestal. O "a" fica de
// boca aberta (o começo); o "un", de boca fechada e com um chifre (o fim)
export function komainuGeometry(variant) {
  return cached(`komainu-${variant}`, () => {
    const y0 = 1.07;
    const open = variant === 'a';
    const parts = [
      // Pedestal em três degraus
      box(1.5, 0.35, 1.2, { y: 0.175 }),
      box(1.22, 0.6, 0.98, { y: 0.65 }),
      box(1.4, 0.12, 1.1, { y: 1.01 }),
      // Ancas, peito erguido e as patas da frente
      lump(0.46, [1.1, 0.78, 1], { y: y0 + 0.33, z: -0.2 }),
      lump(0.38, [1, 1.4, 0.92], { y: y0 + 0.74, z: 0.08 }),
      cyl(0.09, 0.11, 0.62, 5, { x: -0.2, y: y0 + 0.3, z: 0.3 }),
      cyl(0.09, 0.11, 0.62, 5, { x: 0.2, y: y0 + 0.3, z: 0.3 }),
      box(0.2, 0.1, 0.26, { x: -0.2, y: y0 + 0.05, z: 0.38 }),
      box(0.2, 0.1, 0.26, { x: 0.2, y: y0 + 0.05, z: 0.38 }),
      // Juba encaracolada atrás da cabeça, cabeça e orelhas
      lump(0.44, [1.28, 1.08, 0.78], { y: y0 + 1.2, z: 0.02 }),
      lump(0.32, [1.1, 1, 1], { y: y0 + 1.28, z: 0.2 }),
      cone(0.07, 0.16, 4, { x: -0.23, y: y0 + 1.55, z: 0.12 }),
      cone(0.07, 0.16, 4, { x: 0.23, y: y0 + 1.55, z: 0.12 }),
      // Cauda em chama, erguida atrás
      cone(0.26, 0.75, 5, { y: y0 + 0.86, z: -0.55, rotX: -0.55 }),
    ];
    if (open) {
      // Boca aberta: maxila e mandíbula separadas
      parts.push(box(0.3, 0.12, 0.24, { y: y0 + 1.27, z: 0.48, rotX: -0.22 }));
      parts.push(box(0.26, 0.08, 0.2, { y: y0 + 1.08, z: 0.44, rotX: 0.3 }));
    } else {
      parts.push(box(0.3, 0.2, 0.24, { y: y0 + 1.18, z: 0.47 }));
      // O chifre do "un"
      parts.push(cone(0.06, 0.24, 5, { y: y0 + 1.66, z: 0.2, rotX: 0.25 }));
    }
    return assemble(parts);
  });
}

// 石灯籠 (ishidōrō) no estilo kasuga: base, haste, plataforma, caixa de luz (火袋) com a janela
// acesa, telhado com os cantos virados para cima e a joia (宝珠) no topo
export function stoneLanternGeometry() {
  return cached('stone-lantern', () => {
    const corners = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2 + Math.PI / 6);
    const stone = assemble([
      cyl(0.55, 0.62, 0.3, 6, { y: 0.15 }),
      cyl(0.17, 0.21, 1.2, 8, { y: 0.9 }),
      cyl(0.5, 0.3, 0.28, 6, { y: 1.64 }),
      // Caixa de luz: seis colunas finas entre duas placas; a luz aparece entre elas
      cyl(0.38, 0.38, 0.06, 6, { y: 1.81 }),
      ...corners.map((a) => box(0.09, 0.5, 0.09, { x: Math.cos(a) * 0.32, y: 2.07, z: Math.sin(a) * 0.32, rotY: -a })),
      cyl(0.38, 0.38, 0.06, 6, { y: 2.33 }),
      // Telhado (笠) e os cantos virados (蕨手)
      cyl(0.1, 0.74, 0.32, 6, { y: 2.52 }),
      ...corners.map((a) => cone(0.06, 0.16, 4, { x: Math.cos(a) * 0.7, y: 2.42, z: Math.sin(a) * 0.7, rotZ: -0.5 * Math.cos(a), rotX: 0.5 * Math.sin(a) })),
      placed(paint(new SphereGeometry(0.13, 6, 4)), { y: 2.76 }),
      cone(0.12, 0.17, 6, { y: 2.92 }),
    ]);
    const light = assemble([cyl(0.27, 0.27, 0.44, 6, { y: 2.07 })]);
    return { stone, light };
  });
}

// 太鼓橋 (taikobashi): ponte em arco vermelha atravessando o rio, de margem a margem (eixo x).
// Tabuleiro em arco, gradis nos dois lados com postes e giboshi de bronze, pilares na água
export function taikobashiGeometry({ span = 48, rise = 6.5, width = 4 } = {}) {
  return cached(`taikobashi-${span}-${rise}-${width}`, () => {
    const half = span / 2;
    const archY = (x) => rise * (1 - (x / half) ** 2);
    // Tabuleiro: faixa em arco (topo e fundo) extrudada na largura
    const deck = new Shape();
    const steps = 48;
    for (let i = 0; i <= steps; i += 1) {
      const x = -half + (span * i) / steps;
      if (i === 0) deck.moveTo(x, archY(x) + 0.55);
      else deck.lineTo(x, archY(x) + 0.55);
    }
    for (let i = steps; i >= 0; i -= 1) {
      const x = -half + (span * i) / steps;
      deck.lineTo(x, archY(x) - 0.15 - 0.35 * (1 - Math.abs(x) / half));
    }
    deck.closePath();
    const deckGeometry = paint(new ExtrudeGeometry(deck, { depth: width, bevelEnabled: false, curveSegments: 1 }));
    deckGeometry.translate(0, 0, -width / 2);

    const red = [];
    const bronze = [];
    const dark = [deckGeometry];
    const postEvery = 3;
    for (const side of [-1, 1]) {
      const z = side * (width / 2 - 0.15);
      // Corrimão de cima e o do meio acompanhando o arco
      for (const lift of [1.25, 0.75]) {
        const points = Array.from({ length: 25 }, (_, i) => {
          const x = -half + 1 + ((span - 2) * i) / 24;
          return new Vector3(x, archY(x) + 0.55 + lift, z);
        });
        red.push(paint(new TubeGeometry(new CatmullRomCurve3(points), 64, lift > 1 ? 0.12 : 0.08, 5, false)));
      }
      for (let x = -half + 1; x <= half - 1 + 1e-6; x += postEvery) {
        const y = archY(x) + 0.55;
        red.push(box(0.26, 1.35, 0.26, { x, y: y + 0.67, z }));
        // 擬宝珠 (giboshi): botão de bronze em forma de cebola no topo dos postes das pontas
        if (Math.abs(x) > half - 1 - postEvery || Math.abs(x) < postEvery / 2) {
          bronze.push(placed(paint(new SphereGeometry(0.2, 6, 4)), { x, y: y + 1.5, z }));
          bronze.push(cone(0.16, 0.3, 6, { x, y: y + 1.75, z }));
        }
      }
    }
    // Pilares dentro da água, sob o arco
    for (const x of [-half * 0.72, -half * 0.42, half * 0.42, half * 0.72]) {
      const top = archY(x) - 0.1;
      for (const z of [-width / 2 + 0.4, width / 2 - 0.4]) {
        red.push(cyl(0.22, 0.26, top + 3, 6, { x, y: (top - 3) / 2, z }));
      }
    }
    return { red: assemble(red), dark: assemble(dark), bronze: assemble(bronze) };
  });
}

// 鹿威し (shishi-odoshi): a bica (筧) enche o bambu basculante, que tomba, bate na pedra e volta.
// O bambu (`pipe`) gira em torno do eixo em (0, PIVOT_Y, 0); o resto é fixo
export const SHISHI_PIVOT_Y = 0.92;
export function shishiOdoshiGeometry() {
  return cached('shishi-odoshi', () => {
    const fixed = assemble([
      // Os dois postes que seguram o eixo
      cyl(0.05, 0.05, 1.05, 6, { x: 0.05, y: 0.52, z: -0.2 }),
      cyl(0.05, 0.05, 1.05, 6, { x: 0.05, y: 0.52, z: 0.2 }),
      cyl(0.025, 0.025, 0.48, 5, { x: 0.05, y: SHISHI_PIVOT_Y, rotX: Math.PI / 2 }),
      // A bica: poste e o bambu que despeja na boca do basculante
      cyl(0.07, 0.07, 1.7, 6, { x: 1.35, y: 0.85 }),
      cyl(0.05, 0.05, 0.62, 6, { x: 1.08, y: 1.62, rotZ: Math.PI / 2 - 0.2 }),
    ]);
    const stone = assemble([
      lump(0.36, [1.2, 0.55, 1], { x: -0.62, y: 0.12 }, 1),
      lump(0.26, [1.1, 0.7, 1.2], { x: 0.9, y: 0.1, z: 0.25 }, 0),
      lump(0.2, [1, 0.6, 1], { x: -0.1, y: 0.06, z: 0.4 }, 0),
    ]);
    // Bambu basculante: deitado no eixo x, com a boca (corte) do lado da bica
    const pipe = assemble([cyl(0.085, 0.085, 1.7, 7, { x: 0.15, rotZ: Math.PI / 2 }), cyl(0.095, 0.095, 0.05, 7, { x: -0.35, rotZ: Math.PI / 2 })]);
    return { fixed, stone, pipe };
  });
}

// Superfície em grade (u de -1 a 1 ao longo da borda, v de 0 a 1 subindo), girada para as quatro
// faces de um telhado quadrado. `point(u, v)` devolve [x, y, z] da face da frente (+z)
function fourFaces(point, nu = 10, nv = 5) {
  const positions = [];
  for (let k = 0; k < 4; k += 1) {
    const c = Math.cos((k * Math.PI) / 2);
    const sn = Math.sin((k * Math.PI) / 2);
    const at = (i, j) => {
      const [x, y, z] = point(-1 + (2 * i) / nu, j / nv);
      return [x * c + z * sn, y, -x * sn + z * c];
    };
    for (let i = 0; i < nu; i += 1) {
      for (let j = 0; j < nv; j += 1) {
        const a = at(i, j);
        const b = at(i + 1, j);
        const d = at(i, j + 1);
        const e = at(i + 1, j + 1);
        positions.push(...a, ...b, ...e, ...a, ...e, ...d);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return paint(g);
}

// Telhado de pagode: quatro águas côncavas (反り) com os cantos levantados no beiral (軒反り),
// a parte de baixo do beiral (forro) e a borda das pontas dos caibros
function pagodaRoof({ y, eave, top, rise, body, lift = 0.32, sag = 0.28, thickness = 0.16 }) {
  const half = (v) => eave / 2 + (top / 2 - eave / 2) * v ** 0.8;
  const surfaceY = (u, v) => y + rise * (v - sag * v * (1 - v)) + lift * Math.abs(u) ** 4 * (1 - v) ** 2;
  const surface = fourFaces((u, v) => [u * half(v), surfaceY(u, v), half(v)]);
  // Forro: do beiral (embaixo da superfície) até a faixa de mísulas junto ao corpo
  const soffit = fourFaces((u, v) => {
    const h = eave / 2 + (body / 2 + 0.18 - eave / 2) * v;
    return [u * h, surfaceY(u, 0) - thickness + (0.05 - lift * Math.abs(u) ** 4 * 0.6) * v, h];
  }, 10, 2);
  // Borda (鼻隠し): faixa vertical ao longo do beiral, entre a superfície e o forro
  const fascia = fourFaces((u, v) => [(u * eave) / 2, surfaceY(u, 0) - thickness * v, eave / 2], 10, 1);
  return { surface, soffit, fascia, corner: [eave / 2, surfaceY(1, 0) - thickness, eave / 2] };
}

// 五重塔 (gojū-no-tō), nas proporções dos pagodes reais: o último andar tem ~0,5 da largura do
// primeiro, os beirais vão de 2,2× a 3,0× a largura do corpo, a altura total é ~5× a largura do
// térreo e o 相輪 (sōrin) é ~1/3,4 dela. Corpo de pilares vermelhos com paredes brancas, faixa de
// mísulas sob o beiral, balcões com gradil, sinos 風鐸 nos cantos e o mastro com nove anéis
export function pagodaGeometry() {
  return cached('pagoda', () => {
    const red = [];
    const plaster = [];
    const roof = [];
    const bronze = [];
    const W1 = 2.6;
    const width = (i) => W1 + (W1 * 0.51 - W1) * (i / 4);
    const heights = [1.55, 1.2, 1.15, 1.1, 1.05];
    // Base de pedra (基壇) com degraus na frente
    plaster.push(box(4, 0.42, 4, { y: 0.21 }));
    plaster.push(box(1.2, 0.14, 0.5, { y: 0.07, z: 2.2 }), box(1.2, 0.14, 0.3, { y: 0.21, z: 2.05 }));
    let y = 0.42;
    for (let i = 0; i < 5; i += 1) {
      const w = width(i);
      const h = heights[i];
      // Paredes de reboco e a moldura vermelha: pilares nos cantos e em três vãos por face
      plaster.push(box(w - 0.06, h, w - 0.06, { y: y + h / 2 }));
      for (const fx of [-1, -1 / 3, 1 / 3, 1]) {
        for (const fz of [-1, 1]) {
          red.push(box(0.11, h, 0.11, { x: (fx * w) / 2, y: y + h / 2, z: (fz * w) / 2 }));
          red.push(box(0.11, h, 0.11, { x: (fz * w) / 2, y: y + h / 2, z: (fx * w) / 2 }));
        }
      }
      // Vigas (長押) embaixo e em cima do andar
      for (const by of [y + 0.08, y + h - 0.1]) {
        red.push(box(w + 0.04, 0.09, 0.08, { y: by, z: w / 2 }), box(w + 0.04, 0.09, 0.08, { y: by, z: -w / 2 }));
        red.push(box(0.08, 0.09, w + 0.04, { y: by, x: w / 2 }), box(0.08, 0.09, w + 0.04, { y: by, x: -w / 2 }));
      }
      if (i === 0) {
        // Portas escuras no vão do meio de cada face
        for (let k = 0; k < 4; k += 1) {
          const door = box(0.62, 0.95, 0.06, { y: y + 0.55, z: w / 2 + 0.01 });
          door.rotateY((k * Math.PI) / 2);
          roof.push(door);
        }
      } else {
        // Balcão (高欄) em volta do andar, logo acima do telhado de baixo
        const r = w + 0.42;
        for (const ry of [y + 0.12, y + 0.34]) {
          red.push(box(r, 0.05, 0.05, { y: ry, z: r / 2 }), box(r, 0.05, 0.05, { y: ry, z: -r / 2 }));
          red.push(box(0.05, 0.05, r, { y: ry, x: r / 2 }), box(0.05, 0.05, r, { y: ry, x: -r / 2 }));
        }
        for (const [cx, cz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          red.push(box(0.07, 0.4, 0.07, { x: (cx * r) / 2, y: y + 0.2, z: (cz * r) / 2 }));
        }
      }
      y += h;
      // Mísulas (組物): faixa vermelha que se abre sob o beiral, em dois degraus
      red.push(box(w + 0.18, 0.16, w + 0.18, { y: y + 0.08 }), box(w + 0.42, 0.14, w + 0.42, { y: y + 0.22 }));
      y += 0.29;
      const last = i === 4;
      const eave = w * (2.2 + 0.2 * i);
      const rise = last ? 1.05 : 0.5;
      const top = last ? 0.34 : width(i + 1) + 0.12;
      const { surface, soffit, fascia, corner } = pagodaRoof({ y, eave, top, rise, body: w });
      roof.push(surface);
      red.push(soffit);
      plaster.push(fascia);
      // 風鐸: sino de bronze pendurado em cada canto do beiral
      const [cx, cy, cz] = corner;
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        bronze.push(cyl(0.015, 0.015, 0.16, 4, { x: sx * cx, y: cy - 0.08, z: sz * cz }));
        // Sino: largo embaixo, preso pela ponta
        bronze.push(cone(0.075, 0.17, 6, { x: sx * cx, y: cy - 0.24, z: sz * cz }));
      }
      y += last ? rise : rise - 0.1;
    }
    // 相輪: base (露盤), tigela (伏鉢), nove anéis (九輪), a chama de água (水煙) e a joia (宝珠)
    const s0 = y - 0.15;
    bronze.push(box(0.42, 0.18, 0.42, { y: s0 + 0.09 }));
    bronze.push(placed(paint(new SphereGeometry(0.2, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)), { y: s0 + 0.18 }));
    bronze.push(cyl(0.045, 0.06, 3.6, 6, { y: s0 + 1.98 }));
    for (let r = 0; r < 9; r += 1) {
      const ring = 0.2 - r * 0.008;
      bronze.push(cyl(ring, ring, 0.05, 8, { y: s0 + 0.55 + r * 0.22 }));
    }
    for (let k = 0; k < 4; k += 1) {
      const flame = paint(new ConeGeometry(0.13, 0.55, 4));
      flame.scale(1, 1, 0.25);
      flame.rotateX(-0.35);
      flame.translate(0, 0, 0.12);
      flame.rotateY((k * Math.PI) / 2);
      flame.translate(0, s0 + 2.95, 0);
      bronze.push(flame);
    }
    bronze.push(placed(paint(new SphereGeometry(0.11, 8, 6)), { y: s0 + 3.55 }), cone(0.08, 0.16, 6, { y: s0 + 3.7 }));
    return { red: assemble(red), plaster: assemble(plaster), roof: assemble(roof), bronze: assemble(bronze) };
  });
}

// 竹 (take): caule de bambu de altura 1 (a instância estica), com os nós marcados
export function bambooStalkGeometry() {
  return cached('bamboo', () => {
    const parts = [cyl(0.085, 0.1, 1, 6, { y: 0.5 })];
    for (let i = 1; i < 7; i += 1) parts.push(cyl(0.105, 0.105, 0.012, 6, { y: i / 7 }));
    return assemble(parts);
  });
}

// Tufo de folhas de bambu: lâminas finas abertas em leque, presas no topo do caule
export function bambooLeavesGeometry() {
  return cached('bamboo-leaves', () => {
    const blades = [];
    for (let i = 0; i < 9; i += 1) {
      const a = (i / 9) * Math.PI * 2;
      const blade = paint(new ConeGeometry(0.08, 1.1, 3));
      blade.scale(1, 1, 0.25);
      placed(blade, { y: -0.55, rotX: 0 });
      blade.rotateZ(Math.PI / 2 + 0.5 + (i % 3) * 0.18);
      blade.rotateY(a);
      blade.translate(0, -0.1 * (i % 3), 0);
      blades.push(blade);
    }
    return assemble(blades);
  });
}

// 木霊 (kodama): espírito pequeno da floresta, corpo branco e cabeça redonda. A cabeça é uma
// peça à parte (gira); o rosto (olhos e boca) é escuro
export function kodamaGeometry() {
  return cached('kodama', () => {
    const body = assemble([cyl(0.1, 0.15, 0.34, 6, { y: 0.17 }), cyl(0.03, 0.035, 0.16, 4, { x: -0.13, y: 0.18, rotZ: 0.6 }), cyl(0.03, 0.035, 0.16, 4, { x: 0.13, y: 0.18, rotZ: -0.6 })]);
    const head = assemble([lump(0.17, [1.05, 1.12, 0.95], { y: 0.16 }, 1)]);
    const face = assemble([
      placed(paint(new SphereGeometry(0.028, 5, 3)), { x: -0.06, y: 0.19, z: 0.15 }),
      placed(paint(new SphereGeometry(0.028, 5, 3)), { x: 0.06, y: 0.19, z: 0.15 }),
      placed(paint(new SphereGeometry(0.022, 5, 3)), { y: 0.1, z: 0.158 }),
    ]);
    return { body, head, face };
  });
}


// Espada deitada ao longo de x, centrada em x = 0 e apoiada (com o fio para cima) nos braços do
// suporte em ±`rest`: a 反り (curvatura) ergue o meio. Bainha laqueada, tsuba, cabo com ito
function swordParts({ length, y, radius, rest, z }, out) {
  const half = length / 2;
  const sori = 0.045 * length;
  const at = (x) => new Vector3(x, y + radius + sori * ((rest / half) ** 2 - (x / half) ** 2), z);
  const along = (from, to, n = 8) => new CatmullRomCurve3(Array.from({ length: n + 1 }, (_, i) => at(from + ((to - from) * i) / n)));
  const tip = -half;
  const tsuba = tip + 0.7 * length;
  const end = half;
  out.saya.push(paint(new TubeGeometry(along(tip, tsuba), 10, radius, 6, false)));
  out.wrap.push(paint(new TubeGeometry(along(tsuba + 0.015, end - 0.02, 4), 4, radius * 0.92, 6, false)));
  const cap = (x, r, h) => {
    const p = at(x);
    return cyl(r, r, h, 8, { x: p.x, y: p.y, z: p.z, rotZ: Math.PI / 2 });
  };
  // 鐺 (kojiri) na ponta da bainha, 鍔 (tsuba) e 頭 (kashira) no fim do cabo
  out.metal.push(cap(tip + 0.01, radius * 1.05, 0.03), cap(tsuba + 0.006, radius * 2.3, 0.022), cap(end - 0.012, radius * 1.02, 0.03));
}

// 刀掛け com o 大小: suporte de laca preta com dois andares, a katana em cima e a wakizashi
// embaixo, sobre uma laje de pedra. Frente em +z, espadas ao longo de x
export function katanaGeometry() {
  return cached('katana', () => {
    const rest = 0.4;
    const lacquer = [box(1.4, 0.07, 0.42, { y: 0.035 })];
    for (const x of [-rest, rest]) {
      lacquer.push(box(0.08, 0.98, 0.09, { x, y: 0.52, z: -0.1 }));
      // Braços com um gancho na ponta (a espada não rola para a frente)
      for (const y of [0.5, 0.86]) {
        lacquer.push(box(0.08, 0.055, 0.26, { x, y, z: 0.02 }));
        lacquer.push(box(0.08, 0.08, 0.04, { x, y: y + 0.06, z: 0.13 }));
      }
    }
    const swords = { saya: [], wrap: [], metal: [] };
    swordParts({ length: 1.25, y: 0.89, radius: 0.034, rest, z: 0.04 }, swords);
    swordParts({ length: 0.88, y: 0.53, radius: 0.03, rest, z: 0.04 }, swords);
    return {
      stone: assemble([box(1.9, 0.4, 0.8, { y: -0.18 })]),
      lacquer: assemble(lacquer),
      saya: assemble(swords.saya),
      wrap: assemble(swords.wrap),
      metal: assemble(swords.metal),
    };
  });
}
