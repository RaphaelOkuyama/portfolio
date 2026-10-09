import {
  BoxGeometry, BufferGeometry, CatmullRomCurve3, ConeGeometry, CylinderGeometry, DodecahedronGeometry, ExtrudeGeometry,
  Float32BufferAttribute, IcosahedronGeometry, Shape, SphereGeometry, TorusGeometry, TubeGeometry, Vector3,
} from 'three';
import { assemble, paint, placed } from './lowpoly';
import { segment } from './tanabataGeometry';

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

// Volume orgânico facetado (icosaedro subdividido): lê como pedra esculpida, não como rocha bruta
const blob = (r, scale, at, tone = 1) => {
  const g = paint(new IcosahedronGeometry(r, 1), [tone, tone, tone]);
  g.scale(...scale);
  return placed(g, at);
};
const tinted = (geometry, rgb) => paint(geometry, rgb);

// Ruído estável por face (hash do centro da face), de 0 a 1
const hash3 = (x, y, z) => {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
};

// Pedra envelhecida: cada face ganha um tom levemente diferente (granito), as faces viradas
// para dentro da figura (entre os cachos, sob o queixo) escurecem como sujeira acumulada, o pé
// fica encardido e os topos ganham líquen em manchas. Tudo pintado nos vértices, sem textura.
// `axisZ(y)`: z do eixo da figura naquela altura (a cabeça fica mais à frente que o corpo)
function weather(geometry, axisZ) {
  const pos = geometry.attributes.position;
  const col = geometry.attributes.color;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const e = new Vector3();
  const n = new Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    n.subVectors(c, b).cross(e.subVectors(a, b)).normalize();
    const cx = (a.x + b.x + c.x) / 3;
    const cy = (a.y + b.y + c.y) / 3;
    const cz = (a.z + b.z + c.z) / 3;
    let tone = 0.93 + hash3(cx, cy, cz) * 0.1;
    // Cavidades: na figura, a face que aponta para o eixo fica entre volumes
    const dz = cz - axisZ(cy);
    const facing = (n.x * cx + n.z * dz) / (Math.hypot(cx, dz) || 1);
    if (cy > 1.1 && facing < -0.25) tone *= 0.8;
    if (n.y < -0.5) tone *= 0.88;
    // Faces grandes e planas (o pedestal) ficam lisas: o ruído por face marcaria a diagonal
    if (e.subVectors(a, b).cross(n.clone().subVectors(c, b)).length() > 0.05) tone = 0.98;
    let rgb = [tone, tone, tone];
    // Líquen nos topos da figura voltados para o céu
    if (n.y > 0.6 && cy > 1.15 && hash3(cx * 3.1, cy * 1.7, cz * 2.3) > 0.66) rgb = [tone * 0.93, tone * 1.02, tone * 0.78];
    for (let k = i; k < i + 3; k += 1) {
      // Encardido no pé do pedestal, por vértice (gradiente contínuo)
      const y = pos.getY(k);
      const grime = y < 0.45 ? 0.84 + 0.16 * (y / 0.45) : 1;
      col.setXYZ(k, col.getX(k) * rgb[0] * grime, col.getY(k) * rgb[1] * grime, col.getZ(k) * rgb[2] * grime);
    }
  }
  return geometry;
}

// 狛犬 (komainu): o par de leões guardiões do santuário, sentados num pedestal. O "a" fica de
// boca aberta, com presas, e a pata sobre a joia (玉); o "un", de boca fechada, com o chifre e
// o filhote sob a pata. Cabeça grande (quase 1/3 da figura), olhos saltados, juba em cachos
// (渦) com mechas descendo pelas costas e cauda em chama
export function komainuGeometry(variant) {
  return cached(`komainu-${variant}`, () => {
    const open = variant === 'a';
    const moss = [0.86, 0.92, 0.8];
    const parts = [
      // Pedestal: laje com musgo, chanfro, bloco com painel em moldura, capa e almofada
      placed(tinted(new BoxGeometry(1.62, 0.26, 1.32), moss), { y: 0.13 }),
      placed(tinted(new CylinderGeometry(0.98, 1.06, 0.1, 4, 1), [0.9, 0.94, 0.86]), { y: 0.31, rotY: Math.PI / 4 }),
      box(1.24, 0.56, 1.0, { y: 0.64 }),
      ...[0.5, -0.5].flatMap((z) => [
        box(1.0, 0.06, 0.04, { y: 0.83, z }), box(1.0, 0.06, 0.04, { y: 0.45, z }),
        box(0.06, 0.38, 0.04, { x: -0.47, y: 0.64, z }), box(0.06, 0.38, 0.04, { x: 0.47, y: 0.64, z }),
      ]),
      // Florão em relevo no centro do painel
      blob(0.09, [1.4, 1, 0.35], { y: 0.64, z: 0.5 }, 0.96),
      placed(paint(new CylinderGeometry(1.0, 0.92, 0.1, 4, 1)), { y: 0.97, rotY: Math.PI / 4 }),
      placed(paint(new CylinderGeometry(0.76, 0.84, 0.07, 4, 1), [0.94, 0.94, 0.94]), { y: 1.055, rotY: Math.PI / 4 }),
    ];
    const y0 = 1.09;
    parts.push(
      // Ancas (patas de trás dobradas), patas de trás e o tronco inclinado para trás
      blob(0.27, [0.8, 0.9, 1.2], { x: -0.3, y: y0 + 0.27, z: -0.14 }),
      blob(0.27, [0.8, 0.9, 1.2], { x: 0.3, y: y0 + 0.27, z: -0.14 }),
      blob(0.12, [1, 0.55, 1.45], { x: -0.37, y: y0 + 0.06, z: 0.14 }),
      blob(0.12, [1, 0.55, 1.45], { x: 0.37, y: y0 + 0.06, z: 0.14 }),
      blob(0.34, [1, 1.4, 0.95], { y: y0 + 0.62, z: -0.06, rotX: -0.18 }),
      blob(0.31, [1.15, 1, 0.85], { y: y0 + 0.78, z: 0.14 }),
      // Tufos de pelo nos cotovelos, em chama para trás
      blob(0.1, [0.8, 1.3, 1.2], { x: -0.22, y: y0 + 0.55, z: 0.22, rotX: 0.5 }, 0.94),
      blob(0.1, [0.8, 1.3, 1.2], { x: 0.22, y: y0 + 0.55, z: 0.22, rotX: 0.5 }, 0.94),
    );
    // Patas da frente: perna, pata e três dedos; uma delas pousada na joia ou no filhote
    const leg = (x, lift) => {
      const h = 0.62 - lift;
      parts.push(blob(0.1, [0.95, h / 0.2, 1.05], { x, y: y0 + lift + h / 2, z: 0.32 }));
      parts.push(blob(0.12, [1, 0.6, 1.3], { x, y: y0 + lift + 0.06, z: 0.4 }));
      [-0.07, 0, 0.07].forEach((dx) => parts.push(blob(0.045, [1, 0.8, 1.1], { x: x + dx, y: y0 + lift + 0.05, z: 0.53 }, 1.04)));
    };
    const held = open ? 0.19 : -0.19;
    leg(-held, 0);
    leg(held, 0.2);
    if (open) {
      // 玉: a joia sob a pata, com o sulco em espiral sugerido por um anel
      parts.push(blob(0.11, [1, 1, 1], { x: held, y: y0 + 0.11, z: 0.42 }, 1.06));
      parts.push(placed(paint(new TorusGeometry(0.105, 0.018, 4, 10), [0.88, 0.88, 0.88]), { x: held, y: y0 + 0.11, z: 0.42, rotX: 0.5 }));
    } else {
      // 子獅子: o filhote deitado sob a pata, olhando para cima, com a juba pequena
      parts.push(blob(0.11, [1.1, 0.8, 1.2], { x: held, y: y0 + 0.09, z: 0.42 }));
      parts.push(blob(0.075, [1, 1, 1], { x: held - 0.02, y: y0 + 0.17, z: 0.56 }, 1.04));
      parts.push(blob(0.05, [1.3, 1, 0.7], { x: held - 0.02, y: y0 + 0.2, z: 0.5 }, 0.9));
    }

    // Cabeça (montada em volta do centro e depois ampliada): crânio largo, focinho achatado, nariz
    // largo, olhos saltados sob as sobrancelhas em cacho, bochechas e orelhas caídas
    const hy = y0 + 1.22;
    const head = [
      blob(0.3, [1.2, 1, 1], { y: hy, z: 0.12 }),
      blob(0.17, [1.4, 0.78, 1], { y: hy - 0.1, z: 0.36 }),
      blob(0.075, [1.6, 0.85, 1], { y: hy - 0.03, z: 0.52 }, 1.06),
      blob(0.066, [1, 1, 0.85], { x: -0.13, y: hy + 0.07, z: 0.38 }, 1.12),
      blob(0.066, [1, 1, 0.85], { x: 0.13, y: hy + 0.07, z: 0.38 }, 1.12),
      blob(0.075, [1.5, 0.7, 0.9], { x: -0.13, y: hy + 0.17, z: 0.36, rotZ: -0.3 }, 0.96),
      blob(0.075, [1.5, 0.7, 0.9], { x: 0.13, y: hy + 0.17, z: 0.36, rotZ: 0.3 }, 0.96),
      blob(0.11, [1, 1, 0.8], { x: -0.22, y: hy - 0.12, z: 0.3 }),
      blob(0.11, [1, 1, 0.8], { x: 0.22, y: hy - 0.12, z: 0.3 }),
      blob(0.1, [1.3, 0.5, 0.8], { x: -0.32, y: hy + 0.16, z: 0.05, rotZ: 0.8 }),
      blob(0.1, [1.3, 0.5, 0.8], { x: 0.32, y: hy + 0.16, z: 0.05, rotZ: -0.8 }),
    ];
    if (open) {
      // "A": mandíbula aberta, a boca escura por dentro, a língua e as presas em cima e embaixo
      head.push(blob(0.13, [1.3, 0.45, 1], { y: hy - 0.31, z: 0.33, rotX: 0.35 }));
      head.push(placed(tinted(new BoxGeometry(0.26, 0.1, 0.1), [0.42, 0.42, 0.45]), { y: hy - 0.22, z: 0.43 }));
      head.push(blob(0.06, [1.5, 0.4, 1], { y: hy - 0.26, z: 0.42 }, 0.8));
      [-0.09, 0.09].forEach((x) => {
        head.push(cone(0.024, 0.09, 4, { x, y: hy - 0.19, z: 0.48, rotX: Math.PI }));
        head.push(cone(0.02, 0.07, 4, { x: x * 0.9, y: hy - 0.27, z: 0.46 }));
      });
    } else {
      // "Un": boca fechada e o chifre na testa
      head.push(blob(0.13, [1.3, 0.5, 1], { y: hy - 0.22, z: 0.34 }));
      head.push(cone(0.055, 0.26, 6, { y: hy + 0.33, z: 0.16, rotX: 0.3 }));
    }
    // Juba: cachos em espiral (o cacho e o miolo saltado) em dois anéis em volta do rosto
    const curl = (list, x, y, z, r) => {
      list.push(blob(r, [1, 1, 0.75], { x, y, z }, 0.9));
      list.push(blob(r * 0.45, [1, 1, 0.8], { x: x * 1.02, y, z: z + r * 0.62 }, 1.02));
    };
    for (let i = 0; i <= 12; i += 1) {
      const ang = -0.8 + (i / 12) * (Math.PI + 1.6);
      curl(head, Math.cos(ang) * 0.4, hy + Math.sin(ang) * 0.35, -0.04, 0.1);
      if (i % 2 === 0) curl(head, Math.cos(ang) * 0.26, hy + Math.sin(ang) * 0.24, -0.15, 0.11);
    }
    // Barba em cachos sob o queixo
    [-0.12, 0, 0.12].forEach((x) => curl(head, x, hy - 0.42 + Math.abs(x) * 0.5, 0.28, 0.07));
    const S = 1.14;
    head.forEach((g) => {
      g.translate(0, -hy, -0.12);
      g.scale(S, S, S);
      g.translate(0, hy, 0.12);
      parts.push(g);
    });

    // Mechas da juba descendo pelas costas, afinando
    [-0.26, -0.13, 0, 0.13, 0.26].forEach((x, i) => {
      parts.push(blob(0.09, [0.75, 2.4, 0.6], { x, y: y0 + 0.92 - (i % 2) * 0.06, z: -0.3, rotX: -0.35, rotZ: x * 0.6 }, 0.9));
    });
    // Cauda em chama (尾): cachos empilhados subindo atrás das costas, abrindo em leque
    [[0, 0.32, -0.45, 0.17], [0, 0.58, -0.54, 0.18], [-0.17, 0.78, -0.48, 0.13], [0.17, 0.78, -0.48, 0.13],
      [0, 0.86, -0.54, 0.15], [-0.1, 1.06, -0.46, 0.11], [0.1, 1.06, -0.46, 0.11], [0, 1.16, -0.42, 0.1]]
      .forEach(([x, y, z, r]) => curl(parts, x, y0 + y, z, r));
    parts.push(cone(0.07, 0.22, 6, { y: y0 + 1.32, z: -0.38, rotX: -0.35 }));

    return weather(assemble(parts), (y) => (y > hy - 0.45 ? 0.12 : 0));
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

// 竹: caule com altura 1 (a instância estica em y até a altura de cada um). Afina da base ao topo,
// com nós de verdade: o gomo incha de leve logo abaixo do nó, o nó é um anel claro e cada gomo
// tem o próprio tom (mais escuro embaixo, mais claro no meio)
const STALK_NODES = 11;
export function bambooStalkGeometry() {
  return cached('bamboo', () => {
    const parts = [];
    const radius = (t) => 0.1 - 0.042 * t;
    for (let i = 0; i < STALK_NODES; i += 1) {
      const t0 = i / STALK_NODES;
      const t1 = (i + 1) / STALK_NODES;
      const tone = 0.82 + 0.22 * Math.sin(Math.PI * (i + 0.5) / STALK_NODES) + (i % 2) * 0.04;
      const seg = placed(paint(new CylinderGeometry(radius(t1) * 1.03, radius(t0), t1 - t0, 8), [tone * 0.96, tone, tone * 0.9]), { y: (t0 + t1) / 2 });
      parts.push(seg);
      // Nó: anel um pouco mais largo e claro (amarelado), fino
      if (i > 0) parts.push(placed(paint(new CylinderGeometry(radius(t0) * 1.14, radius(t0) * 1.14, 0.005, 8), [1.22, 1.2, 1.0]), { y: t0 }));
    }
    return assemble(parts);
  });
}

// Folha de bambu: lâmina longa e estreita, deitada ao longo de +x (larga perto da base e com a
// ponta fina), já caída `droop` rad para baixo e girada `yaw` em volta do galho
function bambooLeaf(at, yaw, droop, length, width, tone) {
  const L = length;
  const w = width / 2;
  const pts = [0, 0, 0, L * 0.28, 0, w, L, 0, 0, L * 0.28, 0, -w, L * 0.62, 0, w * 0.55, L * 0.62, 0, -w * 0.55];
  const g = new BufferGeometry();
  // Dois triângulos largos na base e a ponta fina em dois triângulos
  const index = [0, 1, 4, 0, 4, 2, 0, 2, 5, 0, 5, 3];
  const flat = [];
  index.forEach((k) => flat.push(pts[k * 3], pts[k * 3 + 1], pts[k * 3 + 2]));
  g.setAttribute('position', new Float32BufferAttribute(flat, 3));
  g.rotateZ(-droop);
  g.rotateY(yaw);
  g.translate(at.x, at.y, at.z);
  return paint(g, tone);
}

// Copa do bambu, em unidades da cena com a origem na ponta do caule (y negativo desce pelo caule):
// galhos finos saem dos nós do terço de cima, alternando de lado, e cada um termina em leques de
// folhas caídas; no topo, um penacho. Tons de folha variados (a cor final vem da paleta)
export function bambooLeavesGeometry() {
  return cached('bamboo-leaves', () => {
    const parts = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const tones = [[0.78, 0.95, 0.8], [0.92, 1.05, 0.88], [1.05, 1.12, 0.92], [0.85, 1.0, 0.95], [1.12, 1.18, 1.0]];
    const tone = () => tones[Math.floor(rand() * tones.length)];
    const fan = (origin, dir, count, size) => {
      for (let k = 0; k < count; k += 1) {
        const yaw = dir + (k - (count - 1) / 2) * 0.42 + (rand() - 0.5) * 0.25;
        const droop = 0.35 + rand() * 0.55;
        parts.push(bambooLeaf(origin, yaw, droop, size * (0.75 + rand() * 0.4), size * 0.17, tone()));
      }
    };
    const branches = 11;
    for (let i = 0; i < branches; i += 1) {
      const t = i / (branches - 1);
      const y = -3.6 + t * 3.3;
      const dir = i * 2.39996 + rand() * 0.4;
      // Galhos de baixo mais compridos (a copa se abre como um cone de ponta-cabeça bem largo)
      const length = 1.2 - t * 0.7 + rand() * 0.25;
      const rise = 0.5 + rand() * 0.25;
      const end = new Vector3(Math.cos(dir) * length, y + Math.sin(rise) * length * 0.55, -Math.sin(dir) * length);
      const twig = segment(new Vector3(0, y, 0), end, 0.014, 3);
      parts.push(paint(twig, [1.0, 0.95, 0.8]));
      // Leques: um no meio do galho e outro na ponta
      const mid = new Vector3(0, y, 0).lerp(end, 0.55);
      fan(mid, dir + 0.5, 4, 0.72);
      fan(end, dir, 6, 0.82);
    }
    // Penacho no topo: folhas mais curtas, quase em pé, abertas para todos os lados
    for (let k = 0; k < 7; k += 1) {
      parts.push(bambooLeaf(new Vector3(0, 0, 0), (k / 7) * Math.PI * 2 + rand() * 0.3, -0.6 + rand() * 0.5, 0.45, 0.07, tone()));
    }
    return assemble(parts);
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
