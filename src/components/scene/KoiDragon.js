'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, ConeGeometry, CylinderGeometry, DoubleSide, InstancedBufferAttribute,
  InstancedMesh, Matrix4, MeshBasicMaterial, NormalBlending, Object3D, Points, Quaternion, RingGeometry, ShaderMaterial, SphereGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { NOISE } from './glsl';
import { koiGeometry } from './koiGeometry';
import { warm } from './warmup';

// 鯉の滝登り (登竜門): a carpa que vence a cachoeira vira dragão.
//  0,0 s  a carpa dourada salta da água (espirro de gotas, anéis abrindo na superfície, névoa)
//  0,5 s  no alto do salto, um clarão: ela vira dragão e a água sobe atrás numa coluna (a cachoeira
//         que ela venceu). O corpo nasce incandescente e esfria até o ouro
//  0,5–4,6 s o dragão sobe em espiral, serpenteando, atrás da pérola (宝珠) que brilha à frente:
//         ouro metálico com escamas iridescentes, a barriga em placas de marfim, crista e leque da
//         cauda em lâminas vermelhas, a crina e os bigodes em fitas que esvoaçam, chifres de cervo,
//         olhos acesos; ruge no meio da subida. Um rastro de luz fica para trás
//  4,6–5,9 s ele se desfaz em brasas, da cauda para a cabeça, no alto do céu
// Fica montado (escondido) desde que as carpas aparecem: os shaders compilam antes, em segundo
// plano, e o salto não espera a GPU. Coordenadas do rio (o grupo cresce com a distância da câmera)
export const DRAGON = { duration: 6.2, segments: 88, sides: 14, length: 0.0189, rise: 0.5, dissolve: [4.6, 5.9] };

const SEG = DRAGON.segments;
const SIDES = DRAGON.sides;
const SPINES = 26;
const FIN = 9;
const LEGS = [[0.17, 1], [0.17, -1], [0.54, 1], [0.54, -1]];
// Fitas: crina (mechas saindo da nuca), bigodes e as duas flâmulas da cauda; o rastro é à parte
const MANE = 9;
const MANE_PTS = 9;
const WHISKER_PTS = 15;
const STREAMER_PTS = 10;
const TRAIL_PTS = 30;
const RIBBONS = [
  ...Array.from({ length: MANE }, () => [MANE_PTS, 0]),
  [WHISKER_PTS, 1], [WHISKER_PTS, 1],
  [STREAMER_PTS, 2], [STREAMER_PTS, 2],
];

// A cabeça: sai do clarão (acima da água) e sobe em espiral que abre, acelerando no fim
function headAt(t, out) {
  const u = Math.max(0, t);
  const theta = u * 2.7;
  const radius = 0.5 + u * 0.42;
  const y = 0.95 + 0.52 * u ** 1.05 + Math.max(0, u - 4.0) ** 2 * 2.0;
  return out.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
}

// Sombreado do ouro, compartilhado pelo corpo e pelas peças: a lua fria por cima, o reflexo do
// céu noturno e da faixa morna das lanternas no horizonte, o brilho especular e a borda
const SHADE = /* glsl */ `
  vec3 envAt(vec3 r) {
    vec3 sky = mix(vec3(0.16, 0.2, 0.42), vec3(0.03, 0.04, 0.1), smoothstep(0.1, 0.9, r.y));
    vec3 env = mix(vec3(1.0, 0.55, 0.18), sky, smoothstep(-0.05, 0.3, r.y));
    return mix(vec3(0.02, 0.03, 0.06), env, smoothstep(-0.55, -0.1, r.y));
  }
  vec3 shade(vec3 albedo, vec3 N, vec3 V, float metal, float gloss) {
    vec3 L = normalize(vec3(-0.35, 0.85, 0.4));
    float wrap = max((dot(N, L) + 0.35) / 1.35, 0.0);
    vec3 R = reflect(-V, N);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 diffuse = albedo * (0.22 + 0.85 * wrap);
    vec3 metallic = albedo * (envAt(R) * 1.7 + 0.12) + albedo * wrap * 0.35;
    vec3 col = mix(diffuse, metallic, metal);
    float spec = pow(max(dot(N, normalize(L + V)), 0.0), mix(18.0, 90.0, gloss));
    col += mix(vec3(1.0), albedo, metal * 0.5) * spec * (0.25 + gloss);
    // Borda: luz fria da lua contornando a silhueta e um eco dourado
    col += mix(vec3(0.55, 0.65, 1.0), vec3(1.0, 0.72, 0.3), metal) * fres * 0.55;
    return col;
  }
  // Dissolução da cauda para a cabeça (u: 0 cabeça, 1 cauda); devolve a borda acesa (0..1)
  float burnEdge(float u, float n, float d) {
    float cut = (1.0 - u) * 0.85 + n * 0.25;
    float e = d * 1.15 - cut;
    if (e > 0.0) discard;
    return smoothstep(-0.07, 0.0, e) * step(0.001, d);
  }
`;

const bodyVertex = /* glsl */ `
  attribute vec2 aUv;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  void main() {
    vUv = aUv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const bodyFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDissolve;
  uniform float uHeat;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  ${NOISE}
  ${SHADE}
  void main() {
    float u = vUv.x;
    float v = vUv.y;
    float burn = burnEdge(u, vnoise(vec2(u * 38.0, v * 9.0 + u * 3.0)), uDissolve);
    // v: 0,25 é o dorso, 0,75 a barriga (em volta do corpo); u: da cabeça (0) à cauda (1)
    float back = smoothstep(0.3, 0.0, abs(v - 0.25));
    float belly = smoothstep(0.2, 0.07, abs(v - 0.75));
    // Escamas em leque, em fileiras alternadas como telhas, com a borda virada para a cauda
    vec2 g = vec2(u * 92.0, v * 15.0);
    g.y += mod(floor(g.x), 2.0) * 0.5;
    vec2 f = fract(g);
    vec2 id = floor(g);
    float r = length(vec2(f.x * 0.95, f.y - 0.5));
    float h = hash21(id);
    // Cada escama tem um tom um pouco diferente (ouro, âmbar, um quase verde nas bordas: iridescência)
    vec3 gold = mix(vec3(0.82, 0.38, 0.05), vec3(1.0, 0.62, 0.12), h);
    vec3 albedo = gold * mix(0.5, 1.05, smoothstep(0.0, 0.42, r));
    albedo *= 1.0 - smoothstep(0.42, 0.5, r) * 0.55;
    // O dorso puxa para o laranja-vermelho, mais forte perto da cabeça
    vec3 ember = mix(vec3(0.7, 0.1, 0.02), vec3(0.95, 0.3, 0.03), h);
    albedo = mix(albedo, ember * mix(0.6, 1.0, smoothstep(0.0, 0.42, r)), back * (0.45 + 0.4 * smoothstep(0.4, 0.0, u)));
    // Barriga: placas de marfim em faixas, com as emendas marcadas
    float seam = smoothstep(0.8, 1.0, fract(u * 54.0));
    vec3 ivory = mix(vec3(0.95, 0.78, 0.48), vec3(0.6, 0.38, 0.16), seam);
    albedo = mix(albedo, ivory, belly);
    // Cada escama inclinada um pouco: o reflexo pisca de escama em escama
    vec3 N = normalize(vNormalW);
    vec3 tilt = vec3(hash21(id + 7.1), hash21(id + 3.7), hash21(id + 1.3)) - 0.5;
    N = normalize(N + tilt * 0.35 * (1.0 - belly) * smoothstep(0.5, 0.2, r));
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 col = shade(albedo, N, V, mix(0.92, 0.25, belly), mix(0.8, 0.4, belly));
    // Iridescência: no rasante as escamas trocam o ouro por um verde-azulado frio
    float graze = pow(1.0 - max(dot(N, V), 0.0), 2.0);
    col += vec3(0.1, 0.55, 0.45) * graze * (1.0 - belly) * h * 0.35;
    // A onda de luz que corre da cabeça à cauda
    float wave = exp(-pow((u - fract(uTime * 0.42)) * 10.0, 2.0));
    col += vec3(1.5, 0.85, 0.25) * wave * 0.45 * (1.0 - belly * 0.6);
    // Recém-nascido do clarão: incandescente, esfria até o ouro da cabeça para a cauda
    col = mix(col, vec3(2.4, 1.6, 0.8), uHeat * smoothstep(-0.2, 0.6, uHeat - u * 0.6));
    col = mix(col, vec3(3.0, 1.35, 0.3), burn);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

// Peças facetadas (cabeça, mandíbula, patas, crista e leque): low-poly como o resto da cena, mas
// no mesmo ouro do corpo. aKind: 0 ouro, 1 marfim (chifres, dentes, garras), 2 lâmina vermelha
// (escurece na base e acende na ponta: aH), 3 olho aceso, 4 escuro (narinas, pupilas, boca)
const facetVertex = /* glsl */ `
  attribute float aKind;
  attribute float aH;
  attribute float aU;
  varying float vKind;
  varying float vH;
  varying float vU;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec3 vLocal;
  void main() {
    vKind = aKind;
    vH = aH;
    vU = aU;
    vLocal = position;
    mat4 m = modelMatrix;
    #ifdef USE_INSTANCING
      m = m * instanceMatrix;
    #endif
    vec4 world = m * vec4(position, 1.0);
    vNormalW = normalize(mat3(m) * normal);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const facetFragment = /* glsl */ `
  uniform float uDissolve;
  uniform float uHeat;
  uniform float uTime;
  varying float vKind;
  varying float vH;
  varying float vU;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec3 vLocal;
  ${NOISE}
  ${SHADE}
  void main() {
    float burn = burnEdge(vU, vnoise(vLocal.xy * 9.0 + vLocal.z * 5.0), uDissolve);
    vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 col;
    if (vKind < 0.5) {
      col = shade(vec3(0.95, 0.52, 0.08), N, V, 0.92, 0.85);
    } else if (vKind < 1.5) {
      col = shade(vec3(0.95, 0.84, 0.62), N, V, 0.3, 0.6);
    } else if (vKind < 2.5) {
      vec3 blade = mix(vec3(0.42, 0.02, 0.02), vec3(1.0, 0.32, 0.03), smoothstep(0.0, 0.75, vH));
      blade = mix(blade, vec3(1.0, 0.75, 0.25), smoothstep(0.75, 1.0, vH));
      col = shade(blade, N, V, 0.55, 0.7);
    } else if (vKind < 3.5) {
      // Olho: aceso por dentro (passa do limiar do bloom), pulsando de leve
      col = vec3(3.2, 1.3, 0.2) * (0.85 + 0.15 * sin(uTime * 5.0));
    } else {
      col = shade(vec3(0.05, 0.02, 0.02), N, V, 0.2, 0.9);
    }
    col = mix(col, vec3(2.4, 1.6, 0.8), uHeat * smoothstep(-0.2, 0.6, uHeat - vU * 0.6));
    col = mix(col, vec3(3.0, 1.35, 0.3), burn);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

// Fitas (crina, bigodes, flâmulas e o rastro): tiras viradas para a câmera. aRib: x ao longo
// (0 na raiz, 1 na ponta), y de um lado ao outro, z o tipo (0 crina, 1 bigode, 2 flâmula, 3 rastro)
const ribbonVertex = /* glsl */ `
  attribute vec3 aRib;
  varying vec3 vRib;
  void main() {
    vRib = aRib;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ribbonFragment = /* glsl */ `
  uniform float uFade;
  varying vec3 vRib;
  void main() {
    float t = vRib.x;
    float across = 1.0 - abs(vRib.y * 2.0 - 1.0);
    float kind = vRib.z;
    vec3 col;
    float a;
    if (kind < 0.5) {
      // Crina: vermelho escuro na raiz, chama laranja e a ponta dourada, em fios
      col = mix(vec3(0.55, 0.03, 0.02), vec3(1.0, 0.36, 0.04), smoothstep(0.0, 0.65, t));
      col = mix(col, vec3(1.0, 0.78, 0.3), smoothstep(0.7, 1.0, t));
      col *= 0.72 + 0.28 * sin(vRib.y * 34.0 + t * 5.0);
      a = smoothstep(0.0, 0.35, across) * (1.0 - smoothstep(0.55, 1.0, t));
    } else if (kind < 1.5) {
      col = mix(vec3(1.0, 0.72, 0.3), vec3(1.0, 0.95, 0.82), t);
      a = smoothstep(0.0, 0.55, across) * (1.0 - t * t);
    } else if (kind < 2.5) {
      col = mix(vec3(0.7, 0.05, 0.02), vec3(1.0, 0.55, 0.1), t);
      a = smoothstep(0.0, 0.4, across) * (1.0 - smoothstep(0.45, 1.0, t));
    } else {
      // Rastro de luz (somado): mais forte perto da cauda, some no fim
      col = vec3(1.6, 0.9, 0.3);
      a = pow(across, 2.0) * (1.0 - t) * (1.0 - t) * 0.55;
    }
    gl_FragColor = vec4(col, a * uFade);
    #include <colorspace_fragment>
  }
`;

const columnVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vFacing;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFacing = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
  }
`;
const columnFragment = /* glsl */ `
  uniform float uTime;
  uniform float uRise;
  uniform float uFade;
  varying vec2 vUv;
  varying float vFacing;
  ${NOISE}
  void main() {
    // Água subindo: estrias verticais que correm para cima, espuma branca e o topo desfiado; a
    // borda do cilindro some (é água, não um tubo)
    float flow = fbm(vec2(vUv.x * 18.0, vUv.y * 3.0 - uTime * 4.5));
    float streak = smoothstep(0.45, 0.85, flow);
    float top = smoothstep(uRise, uRise - 0.18 - flow * 0.12, vUv.y);
    vec3 col = mix(vec3(0.3, 0.55, 0.85), vec3(0.95, 0.98, 1.0), streak);
    float alpha = (0.26 + streak * 0.6) * top * uFade * smoothstep(0.0, 0.08, vUv.y) * smoothstep(0.05, 0.55, vFacing);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

// Pontos genéricos (faíscas, gotas, névoa, a pérola e o clarão): cor e tamanho por uniforme
const pointVertex = /* glsl */ `
  attribute float aLife;
  uniform float uSize;
  varying float vLife;
  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (0.5 + aLife * 0.5) * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const pointFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uSoft;
  uniform float uAlpha;
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5 || vLife < 0.01) discard;
    float glow = mix(1.0 - smoothstep(0.35, 0.5, d), pow(1.0 - d * 2.0, 2.0), uSoft);
    gl_FragColor = vec4(uColor * (0.8 + glow * 0.6), glow * vLife * uAlpha);
  }
`;

const ringFragment = /* glsl */ `
  uniform float uFade;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(vec3(0.92, 0.97, 1.0), uFade * (0.5 + 0.5 * vUv.x));
  }
`;
const ringVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Montagem das peças facetadas: cada peça leva o tipo e a altura (para o degradê das lâminas)
const UP = new Vector3(0, 1, 0);
function piece(geometry, kind, { scale, root = [0, 0, 0], dir, h = false } = {}) {
  let g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  if (scale) g.scale(...scale);
  const pos = g.attributes.position;
  const n = pos.count;
  const aH = new Float32Array(n);
  if (h) {
    g.computeBoundingBox();
    const { min, max } = g.boundingBox;
    for (let i = 0; i < n; i += 1) aH[i] = (pos.getY(i) - min.y) / Math.max(1e-6, max.y - min.y);
  }
  // Base na origem e apontando para `dir` (o +y da peça vira `dir`)
  if (dir) {
    g.computeBoundingBox();
    g.translate(0, -g.boundingBox.min.y, 0);
    const d = new Vector3(...dir).normalize();
    g.applyMatrix4(new Matrix4().makeRotationFromQuaternion(new Quaternion().setFromUnitVectors(UP, d)));
  }
  g.translate(...root);
  g.setAttribute('aKind', new BufferAttribute(new Float32Array(n).fill(kind), 1));
  g.setAttribute('aH', new BufferAttribute(aH, 1));
  g.setAttribute('aU', new BufferAttribute(new Float32Array(n), 1));
  return g;
}
function join(pieces) {
  const g = mergeGeometries(pieces);
  g.computeVertexNormals();
  return g;
}
const K = { GOLD: 0, IVORY: 1, RED: 2, EYE: 3, DARK: 4 };
const sphere = (r, w = 10, h = 8) => new SphereGeometry(r, w, h);
const cone = (r, len, sides = 6) => new ConeGeometry(r, len, sides);
const cyl = (rt, rb, len, sides = 8) => new CylinderGeometry(rt, rb, len, sides);
// Cilindro deitado ao longo de z (o topo, rt, para a frente), achatado na vertical
function snout(rt, rb, len, flat) {
  const g = cyl(rt, rb, len, 8);
  g.scale(1, 1, flat);
  g.rotateX(Math.PI / 2);
  return g;
}

// Cabeça (frente em +z, alto em +y): crânio com testa marcada, focinho longo que sobe na ponta,
// narinas, presas, olhos acesos sob as sobrancelhas, chifres de cervo, babados vermelhos nas
// bochechas e a crista no alto
let headCache = null;
function dragonHead() {
  if (headCache) return headCache;
  const parts = [
    piece(sphere(0.36, 12, 9), K.GOLD, { scale: [1, 0.78, 1.12] }),
    piece(sphere(0.22, 10, 6), K.GOLD, { scale: [1.35, 0.55, 1.5], root: [0, 0.2, 0.16] }),
    piece(snout(0.15, 0.27, 0.72, 0.72), K.GOLD, { root: [0, 0.0, 0.52] }),
    piece(sphere(0.15, 10, 7), K.GOLD, { scale: [1.3, 0.85, 1], root: [0, 0.05, 0.88] }),
    piece(sphere(0.045, 6, 5), K.DARK, { root: [0.075, 0.13, 0.96] }),
    piece(sphere(0.045, 6, 5), K.DARK, { root: [-0.075, 0.13, 0.96] }),
    // Céu da boca escuro entre as presas
    piece(snout(0.1, 0.18, 0.55, 0.3), K.DARK, { root: [0, -0.12, 0.52] }),
  ];
  for (const sx of [-1, 1]) {
    parts.push(
      // Presas
      piece(cone(0.03, 0.17, 5), K.IVORY, { root: [sx * 0.1, -0.08, 0.74], dir: [sx * 0.1, -1, 0.1] }),
      piece(cone(0.022, 0.1, 5), K.IVORY, { root: [sx * 0.13, -0.08, 0.55], dir: [0, -1, 0] }),
      // Olho aceso, a pupila em fenda e a sobrancelha grossa jogada para trás
      piece(sphere(0.08, 10, 8), K.EYE, { scale: [0.6, 0.9, 1.25], root: [sx * 0.21, 0.13, 0.3] }),
      piece(sphere(0.07, 6, 6), K.DARK, { scale: [0.3, 1.0, 0.25], root: [sx * 0.245, 0.13, 0.33] }),
      piece(cone(0.075, 0.42, 5), K.GOLD, { root: [sx * 0.19, 0.22, 0.38], dir: [sx * 0.35, 0.45, -1] }),
      // Chifres: haste longa para trás e para cima, com duas pontas
      piece(cyl(0.022, 0.055, 1.0, 6), K.IVORY, { root: [sx * 0.15, 0.3, 0.0], dir: [sx * 0.3, 0.55, -1] }),
      piece(cone(0.03, 0.3, 5), K.IVORY, { root: [sx * 0.24, 0.47, -0.3], dir: [sx * 0.4, 1, 0.1] }),
      piece(cone(0.025, 0.24, 5), K.IVORY, { root: [sx * 0.3, 0.59, -0.55], dir: [sx * 0.6, 0.9, 0.2] }),
      // Bochechas: babado de lâminas vermelhas abrindo para trás
      ...[[-0.2, 0.36], [0.12, 0.42], [0.42, 0.34], [-0.5, 0.28]].map(([up, len]) => piece(cone(0.06, len, 4), K.RED, {
        scale: [1, 1, 0.35], root: [sx * 0.28, -0.04 + up * 0.08, 0.12], dir: [sx * 0.75, up, -1], h: true,
      })),
    );
  }
  // Crista no alto da cabeça
  [[0.32, 0.3, 0.06], [0.26, 0.1, 0.05], [0.18, -0.12, 0.045]].forEach(([y, z, r]) => parts.push(
    piece(cone(r, 0.3, 4), K.RED, { scale: [0.4, 1, 1], root: [0, y, z], dir: [0, 0.8, -1], h: true }),
  ));
  headCache = join(parts);
  return headCache;
}

// Mandíbula (dobradiça na origem): abre girando em x. Dentes para cima e a barbicha embaixo
let jawCache = null;
function dragonJaw() {
  if (jawCache) return jawCache;
  const parts = [
    piece(snout(0.1, 0.19, 0.6, 0.6), K.GOLD, { root: [0, -0.04, 0.34] }),
    piece(snout(0.075, 0.14, 0.5, 0.35), K.DARK, { root: [0, 0.015, 0.34] }),
    piece(cone(0.05, 0.45, 5), K.GOLD, { root: [0, -0.1, 0.26], dir: [0, -0.8, -1] }),
    piece(cone(0.035, 0.32, 5), K.IVORY, { root: [0, -0.08, 0.46], dir: [0, -1, -0.6] }),
  ];
  for (const sx of [-1, 1]) {
    parts.push(piece(cone(0.025, 0.12, 5), K.IVORY, { root: [sx * 0.08, 0.02, 0.56], dir: [0, 1, 0.1] }));
    parts.push(piece(cone(0.02, 0.08, 5), K.IVORY, { root: [sx * 0.11, 0.02, 0.4], dir: [0, 1, 0] }));
  }
  jawCache = join(parts);
  return jawCache;
}

// Pata: coxa, antebraço e quatro garras, ao longo de +y a partir da junta (garras para +z)
let legCache = null;
function dragonLeg() {
  if (legCache) return legCache;
  const parts = [
    piece(cyl(0.065, 0.1, 0.32, 7), K.GOLD, { root: [0, 0.16, 0] }),
    piece(sphere(0.07, 7, 5), K.GOLD, { root: [0, 0.32, 0] }),
    piece(cyl(0.045, 0.065, 0.28, 7), K.GOLD, { root: [0, 0.32, 0], dir: [0, 1, 0.45] }),
    piece(cone(0.05, 0.22, 4), K.RED, { scale: [0.4, 1, 1], root: [0, 0.2, -0.05], dir: [0, 0.3, -1], h: true }),
  ];
  [-0.06, -0.02, 0.02, 0.06].forEach((x) => parts.push(
    piece(cone(0.02, 0.15, 5), K.IVORY, { root: [x, 0.56, 0.12], dir: [x * 4, 0.2, 1] }),
  ));
  legCache = join(parts);
  return legCache;
}
// Lâmina da crista e do leque: fina (achatada em x), curva para trás
let bladeCache = null;
function dragonBlade() {
  if (bladeCache) return bladeCache;
  const g = cone(0.075, 0.32, 4);
  g.translate(0, 0.16, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i += 1) p.setZ(i, p.getZ(i) - (p.getY(i) / 0.32) ** 2 * 0.09);
  bladeCache = join([piece(g, K.RED, { scale: [0.3, 1, 1], h: true })]);
  return bladeCache;
}

function ribbonGeometry(list) {
  const total = list.reduce((a, [n]) => a + n, 0);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(total * 2 * 3), 3));
  const rib = new Float32Array(total * 2 * 3);
  const index = [];
  let base = 0;
  list.forEach(([n, kind]) => {
    for (let k = 0; k < n; k += 1) {
      for (let s = 0; s < 2; s += 1) rib.set([k / (n - 1), s, kind], (base + k) * 6 + s * 3);
      if (k < n - 1) {
        const a = (base + k) * 2;
        index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    base += n;
  });
  geometry.setAttribute('aRib', new BufferAttribute(rib, 3));
  geometry.setIndex(index);
  return geometry;
}

export default function KoiDragon({ run, onDone }) {
  const startRef = useRef(0);
  const groupRef = useRef(null);
  const koiRef = useRef(null);
  const headRef = useRef(null);
  const jawRef = useRef(null);
  const ringRefs = useRef([]);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);

  const body = useMemo(() => {
    const vertCount = SEG * SIDES;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertCount * 3), 3));
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(vertCount * 3), 3));
    const uv = new Float32Array(vertCount * 2);
    for (let i = 0; i < SEG; i += 1) {
      for (let j = 0; j < SIDES; j += 1) {
        uv[(i * SIDES + j) * 2] = i / (SEG - 1);
        uv[(i * SIDES + j) * 2 + 1] = j / SIDES;
      }
    }
    geometry.setAttribute('aUv', new BufferAttribute(uv, 2));
    const index = [];
    for (let i = 0; i < SEG - 1; i += 1) {
      for (let j = 0; j < SIDES; j += 1) {
        const a = i * SIDES + j;
        const b = i * SIDES + ((j + 1) % SIDES);
        const c = (i + 1) * SIDES + j;
        const d = (i + 1) * SIDES + ((j + 1) % SIDES);
        index.push(a, c, b, b, c, d);
      }
    }
    geometry.setIndex(index);
    const uniforms = { uTime: { value: 0 }, uDissolve: { value: 0 }, uHeat: { value: 0 } };
    const material = new ShaderMaterial({ vertexShader: bodyVertex, fragmentShader: bodyFragment, side: DoubleSide, uniforms });
    // As peças facetadas dividem o relógio, a dissolução e o calor com o corpo
    const facetMat = new ShaderMaterial({ vertexShader: facetVertex, fragmentShader: facetFragment, side: DoubleSide, uniforms });
    return { geometry, material, facetMat, uniforms };
  }, []);

  const column = useMemo(() => {
    const geometry = new CylinderGeometry(0.7, 1.1, 9, 28, 1, true);
    geometry.translate(0, 4.5, 0);
    const material = new ShaderMaterial({
      vertexShader: columnVertex,
      fragmentShader: columnFragment,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: { uTime: { value: 0 }, uRise: { value: 0 }, uFade: { value: 1 } },
    });
    return { geometry, material };
  }, []);

  // Crista e leque da cauda (lâminas), as quatro patas e as fitas
  const parts = useMemo(() => {
    const bladeGeo = dragonBlade().clone();
    const bladeU = new Float32Array(SPINES + FIN);
    for (let s = 0; s < SPINES; s += 1) bladeU[s] = 0.05 + (s / (SPINES - 1)) * 0.82;
    bladeU.fill(0.97, SPINES);
    bladeGeo.setAttribute('aU', new InstancedBufferAttribute(bladeU, 1));
    const blades = new InstancedMesh(bladeGeo, body.facetMat, SPINES + FIN);
    const legGeo = dragonLeg().clone();
    legGeo.setAttribute('aU', new InstancedBufferAttribute(new Float32Array(LEGS.map(([k]) => k)), 1));
    const legs = new InstancedMesh(legGeo, body.facetMat, LEGS.length);
    blades.frustumCulled = false;
    legs.frustumCulled = false;
    const ribbonMat = new ShaderMaterial({
      vertexShader: ribbonVertex, fragmentShader: ribbonFragment, transparent: true, depthWrite: false, side: DoubleSide, uniforms: { uFade: { value: 0 } },
    });
    const trailMat = new ShaderMaterial({
      vertexShader: ribbonVertex, fragmentShader: ribbonFragment, transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, uniforms: { uFade: { value: 0 } },
    });
    const ribbonGeo = ribbonGeometry(RIBBONS);
    const trailGeo = ribbonGeometry([[TRAIL_PTS, 3]]);
    return { bladeGeo, blades, legGeo, legs, ribbonMat, trailMat, ribbonGeo, trailGeo };
  }, [body]);

  // O salto da carpa e os efeitos de água e luz
  const fx = useMemo(() => {
    const koiMat = new MeshBasicMaterial({ color: '#f2b23a', transparent: true });
    const ringGeo = new RingGeometry(0.46, 0.52, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMats = [0, 1, 2].map(() => new ShaderMaterial({
      vertexShader: ringVertex, fragmentShader: ringFragment, transparent: true, depthWrite: false, uniforms: { uFade: { value: 0 } },
    }));
    const makePoints = (n, color, size, soft, additive, alpha = 1) => {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
      geometry.setAttribute('aLife', new BufferAttribute(new Float32Array(n), 1));
      const material = new ShaderMaterial({
        vertexShader: pointVertex,
        fragmentShader: pointFragment,
        transparent: true,
        depthWrite: false,
        blending: additive ? AdditiveBlending : NormalBlending,
        uniforms: { uColor: { value: color }, uSize: { value: size }, uSoft: { value: soft }, uAlpha: { value: alpha } },
      });
      const points = new Points(geometry, material);
      points.frustumCulled = false;
      const list = Array.from({ length: n }, () => ({ p: new Vector3(), v: new Vector3(), life: 0 }));
      return { geometry, material, points, list, next: 0 };
    };
    const sparks = makePoints(160, new Vector3(1.4, 0.85, 0.35), 9, 1, true);
    const embers = makePoints(220, new Vector3(1.8, 0.75, 0.2), 11, 1, true);
    const drops = makePoints(80, new Vector3(0.85, 0.94, 1), 7, 0, false);
    const mist = makePoints(36, new Vector3(0.78, 0.86, 1), 150, 1, false, 0.22);
    const pearl = makePoints(1, new Vector3(2.2, 1.85, 1.3), 46, 1, true);
    const halo = makePoints(1, new Vector3(1.0, 0.7, 0.35), 160, 1, true, 0.45);
    const flash = makePoints(1, new Vector3(1.4, 1.1, 0.7), 620, 1, true);
    return { koiMat, ringGeo, ringMats, sparks, embers, drops, mist, pearl, halo, flash };
  }, []);

  useEffect(() => () => {
    body.geometry.dispose();
    body.material.dispose();
    body.facetMat.dispose();
    column.geometry.dispose();
    column.material.dispose();
    [parts.bladeGeo, parts.legGeo, parts.ribbonGeo, parts.trailGeo, parts.ribbonMat, parts.trailMat].forEach((x) => x.dispose());
    fx.koiMat.dispose();
    fx.ringGeo.dispose();
    fx.ringMats.forEach((m) => m.dispose());
    [fx.sparks, fx.embers, fx.drops, fx.mist, fx.pearl, fx.halo, fx.flash].forEach((x) => { x.geometry.dispose(); x.material.dispose(); });
  }, [body, column, parts, fx]);

  // Montado escondido: compila os shaders em segundo plano, quando o navegador sossega
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return undefined;
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 300));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const id = idle(() => {
      group.visible = true;
      warm(gl, group, camera, scene).finally(() => { if (!startRef.current) group.visible = false; });
    }, { timeout: 3000 });
    return () => cancel(id);
  }, [gl, camera, scene]);

  const tmp = useMemo(() => ({
    p: Array.from({ length: SEG }, () => new Vector3()),
    t: Array.from({ length: SEG }, () => new Vector3()),
    n: Array.from({ length: SEG }, () => new Vector3()),
    b: Array.from({ length: SEG }, () => new Vector3()),
    r: new Float32Array(SEG),
    pts: Array.from({ length: Math.max(TRAIL_PTS, WHISKER_PTS) }, () => new Vector3()),
    widths: new Float32Array(Math.max(TRAIL_PTS, WHISKER_PTS)),
    up: new Vector3(0, 1, 0),
    v: new Vector3(),
    w: new Vector3(),
    x: new Vector3(),
    cam: new Vector3(),
    tip: new Vector3(),
    m: new Matrix4(),
    o: new Object3D(),
  }), []);

  // Cada salto: relógio zerado, gotas do espirro e névoa na base
  useEffect(() => {
    const group = groupRef.current;
    if (!run || !group) {
      startRef.current = 0;
      if (group) group.visible = false;
      return;
    }
    startRef.current = performance.now() / 1000;
    group.position.set(...run.at);
    group.visible = true;
    // Visto de longe (da Experiência o rio fica lá atrás), o dragão cresce para ter presença
    group.updateMatrixWorld();
    const world = group.getWorldPosition(new Vector3());
    group.scale.setScalar(Math.min(5, Math.max(1, world.distanceTo(camera.position) / 11)));
    fx.drops.list.forEach((d) => {
      const a = Math.random() * Math.PI * 2;
      const s = 0.8 + Math.random() * 1.8;
      d.p.set(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15);
      d.v.set(Math.cos(a) * s * 0.6, 2.2 + Math.random() * 2.6, Math.sin(a) * s * 0.6);
      d.life = 1;
    });
    fx.mist.list.forEach((d, i) => {
      const a = (i / fx.mist.list.length) * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.5;
      d.p.set(Math.cos(a) * r, 0.05 + Math.random() * 0.2, Math.sin(a) * r);
      d.v.set(Math.cos(a) * 0.35, 0.12 + Math.random() * 0.25, Math.sin(a) * 0.35);
      d.life = 0.6 + Math.random() * 0.4;
    });
    [fx.sparks, fx.embers].forEach((pool) => pool.list.forEach((s) => { s.life = 0; }));
  }, [run, fx, camera]);

  const emit = (pool, at, velocity, life = 1) => {
    const item = pool.list[pool.next];
    pool.next = (pool.next + 1) % pool.list.length;
    item.p.copy(at);
    item.v.copy(velocity);
    item.life = life;
  };
  const flushPoints = (pool, dt, gravity, decay, drag = 0) => {
    const pos = pool.geometry.attributes.position;
    const life = pool.geometry.attributes.aLife;
    pool.list.forEach((item, i) => {
      if (item.life > 0) {
        item.v.y -= gravity * dt;
        if (drag) item.v.multiplyScalar(1 - drag * dt);
        item.p.addScaledVector(item.v, dt);
        item.life = Math.max(0, item.life - dt * decay);
        if (gravity && item.p.y < -0.05) item.life = 0;
      }
      pos.setXYZ(i, item.p.x, item.p.y, item.p.z);
      life.setX(i, item.life);
    });
    pos.needsUpdate = true;
    life.needsUpdate = true;
  };

  // Escreve uma fita virada para a câmera a partir dos pontos e larguras em tmp
  const writeRibbon = (pos, start, n) => {
    for (let k = 0; k < n; k += 1) {
      const c = tmp.pts[k];
      const a = tmp.pts[Math.max(0, k - 1)];
      const b = tmp.pts[Math.min(n - 1, k + 1)];
      tmp.v.subVectors(b, a);
      tmp.w.subVectors(tmp.cam, c);
      tmp.x.crossVectors(tmp.v, tmp.w);
      const len = tmp.x.length();
      if (len > 1e-6) tmp.x.multiplyScalar(tmp.widths[k] / len);
      const i = (start + k) * 2;
      pos.setXYZ(i, c.x - tmp.x.x, c.y - tmp.x.y, c.z - tmp.x.z);
      pos.setXYZ(i + 1, c.x + tmp.x.x, c.y + tmp.x.y, c.z + tmp.x.z);
    }
  };
  // Ponto ao longo do corpo com índice fracionário (as fitas seguem o caminho)
  const along = (f, out) => {
    const i = Math.min(SEG - 2, Math.max(0, Math.floor(f)));
    return out.lerpVectors(tmp.p[i], tmp.p[i + 1], Math.min(1, Math.max(0, f - i)));
  };

  useFrame((state, delta) => {
    if (!startRef.current) return;
    const age = performance.now() / 1000 - startRef.current;
    if (age > DRAGON.duration) {
      startRef.current = 0;
      groupRef.current.visible = false;
      onDone();
      return;
    }
    state.invalidate();
    const dt = Math.min(delta, 1 / 20);
    const group = groupRef.current;
    group.worldToLocal(tmp.cam.copy(state.camera.position));

    // O salto: a carpa sai da água num arco, de nariz para cima, e some no clarão
    const koi = koiRef.current;
    if (koi) {
      const k = Math.min(1, age / DRAGON.rise);
      koi.visible = age < DRAGON.rise;
      koi.position.set(0, -0.2 + Math.sin(k * Math.PI * 0.5) * 1.25, 0);
      koi.rotation.set(-1.25 + k * 0.4, k * 2.2, Math.sin(k * 9) * 0.15);
      koi.scale.setScalar(1.5 * (1 - Math.max(0, (k - 0.85) / 0.15) * 0.6));
    }
    // Três anéis abrindo na água, um atrás do outro, e o espirro (a gravidade puxa as gotas de volta)
    fx.ringMats.forEach((m, i) => {
      const ringT = Math.min(1, Math.max(0, (age - i * 0.28) / 1.5));
      m.uniforms.uFade.value = ringT > 0 ? (1 - ringT) ** 2 * (0.55 - i * 0.12) : 0;
      const ring = ringRefs.current[i];
      if (ring) ring.scale.setScalar(1 + (1 - (1 - ringT) ** 3) * (5 + i * 1.5));
    });
    flushPoints(fx.drops, dt, 6.5, 0.6);
    flushPoints(fx.mist, dt, 0, 0.22, 0.6);
    // O clarão da transformação
    const flashT = (age - DRAGON.rise + 0.08) / 0.6;
    fx.flash.list[0].p.set(0, 1.0, 0);
    fx.flash.list[0].life = flashT > 0 && flashT < 1 ? Math.sin(Math.PI * flashT) ** 0.7 : 0;
    flushPoints(fx.flash, dt, 0, 0);

    // A coluna: sobe logo depois do salto, segura enquanto o dragão sai, e desaba
    const colAge = age - 0.25;
    const rise = Math.min(1, Math.max(0, colAge / 0.5)) * (1 - Math.max(0, (colAge - 2.0) / 0.9));
    column.material.uniforms.uTime.value = age;
    column.material.uniforms.uRise.value = Math.max(0, rise);
    column.material.uniforms.uFade.value = Math.max(0, 1 - Math.max(0, colAge - 2.4) / 0.6);

    // O corpo: cada anel é a cabeça um pouco antes no tempo (o corpo segue o caminho dela)
    const t0 = age - DRAGON.rise;
    for (let i = 0; i < SEG; i += 1) headAt(t0 - i * DRAGON.length * (1 + i * 0.007), tmp.p[i]);
    // Referenciais por transporte paralelo (sem torção quando o corpo fica na vertical), puxados de
    // leve para manter o dorso para cima
    const frames = () => {
      for (let i = 0; i < SEG; i += 1) {
        const a = tmp.p[Math.max(0, i - 1)];
        const b = tmp.p[Math.min(SEG - 1, i + 1)];
        tmp.t[i].subVectors(a, b);
        if (tmp.t[i].lengthSq() < 1e-10) tmp.t[i].set(0, 1, 0.001);
        tmp.t[i].normalize();
        tmp.w.crossVectors(tmp.t[i], tmp.up);
        if (i === 0) tmp.n[0].copy(tmp.w.lengthSq() > 1e-4 ? tmp.w : tmp.v.set(1, 0, 0));
        else {
          tmp.n[i].copy(tmp.n[i - 1]).addScaledVector(tmp.t[i], -tmp.n[i - 1].dot(tmp.t[i]));
          tmp.n[i].addScaledVector(tmp.w, 0.15);
        }
        tmp.n[i].normalize();
        tmp.b[i].crossVectors(tmp.n[i], tmp.t[i]).normalize();
      }
    };
    frames();
    // Serpenteia: uma onda lateral corre pelo corpo (mais solta na cauda)
    for (let i = 1; i < SEG; i += 1) {
      const k = i / (SEG - 1);
      tmp.p[i].addScaledVector(tmp.n[i], Math.sin(i * 0.3 - age * 6.5) * 0.09 * Math.min(1, k * 5));
    }
    frames();
    for (let i = 0; i < SEG; i += 1) {
      const k = i / (SEG - 1);
      // Pescoço saindo da cabeça, peito cheio e a cauda afinando, respirando de leve
      const profile = k < 0.06 ? 0.62 + 0.38 * (k / 0.06) : k < 0.2 ? 1 : (1 - (k - 0.2) / 0.8) ** 0.85;
      tmp.r[i] = (0.3 * profile + 0.012) * (1 + Math.sin(k * 20 - age * 9) * 0.04);
    }
    const pos = body.geometry.attributes.position;
    const nor = body.geometry.attributes.normal;
    for (let i = 0; i < SEG; i += 1) {
      const r = tmp.r[i];
      for (let j = 0; j < SIDES; j += 1) {
        const ang = (j / SIDES) * Math.PI * 2;
        const cx = Math.cos(ang);
        const cy = Math.sin(ang);
        // Seção oval, um pouco mais alta que larga na barriga achatada
        const nx = tmp.n[i].x * cx + tmp.b[i].x * cy;
        const ny = tmp.n[i].y * cx + tmp.b[i].y * cy;
        const nz = tmp.n[i].z * cx + tmp.b[i].z * cy;
        const sy = cy < 0 ? 0.82 : 0.95;
        const px = tmp.n[i].x * cx + tmp.b[i].x * cy * sy;
        const py = tmp.n[i].y * cx + tmp.b[i].y * cy * sy;
        const pz = tmp.n[i].z * cx + tmp.b[i].z * cy * sy;
        const idx = i * SIDES + j;
        pos.setXYZ(idx, tmp.p[i].x + px * r, tmp.p[i].y + py * r, tmp.p[i].z + pz * r);
        nor.setXYZ(idx, nx, ny, nz);
      }
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    const u = body.uniforms;
    u.uTime.value = age;
    const [d0, d1] = DRAGON.dissolve;
    const dissolve = Math.min(1, Math.max(0, (age - d0) / (d1 - d0)));
    u.uDissolve.value = dissolve;
    u.uHeat.value = Math.max(0, 1 - (age - DRAGON.rise) / 0.9);
    const born = Math.min(1, Math.max(0, (age - DRAGON.rise) / 0.2));
    const fade = born * (1 - dissolve);
    parts.ribbonMat.uniforms.uFade.value = fade;
    parts.trailMat.uniforms.uFade.value = fade;
    const alive = born > 0 && dissolve < 1;
    group.children.forEach((c) => { if (c.userData.dragon) c.visible = alive; });

    // Crista: lâminas no dorso, inclinadas para trás, maiores no meio
    const o = tmp.o;
    const placeBasis = (index, at, y, side, scale, mesh) => {
      tmp.x.copy(side).addScaledVector(y, -side.dot(y)).normalize();
      tmp.w.crossVectors(tmp.x, y);
      tmp.m.makeBasis(tmp.x, y, tmp.w);
      o.quaternion.setFromRotationMatrix(tmp.m);
      o.position.copy(at);
      if (typeof scale === 'number') o.scale.setScalar(scale);
      else o.scale.copy(scale);
      o.updateMatrix();
      mesh.setMatrixAt(index, o.matrix);
    };
    for (let s = 0; s < SPINES; s += 1) {
      const i = Math.round(3 + (s / (SPINES - 1)) * (SEG * 0.86 - 3));
      tmp.tip.copy(tmp.p[i]).addScaledVector(tmp.b[i], tmp.r[i] * 0.85);
      tmp.v.copy(tmp.b[i]).addScaledVector(tmp.t[i], -0.55).normalize();
      const grow = Math.sin(Math.PI * Math.min(1, (s + 2) / SPINES));
      placeBasis(s, tmp.tip, tmp.v, tmp.n[i], 0.45 + tmp.r[i] * 2.6 * grow, parts.blades);
    }
    // Leque da cauda: lâminas abrindo do dorso para a barriga, no fim do corpo
    const tailI = SEG - 3;
    for (let f = 0; f < FIN; f += 1) {
      const a = -1.05 + (f / (FIN - 1)) * 2.1;
      tmp.v.copy(tmp.b[tailI]).multiplyScalar(Math.sin(a)).addScaledVector(tmp.t[tailI], -Math.cos(a) * 1.3).normalize();
      const flutter = 1 + Math.sin(age * 9 + f) * 0.08;
      placeBasis(SPINES + f, tmp.p[tailI], tmp.v, tmp.n[tailI], tmp.tip.set(1.8, (2.9 - Math.abs(a) * 0.9) * flutter, 1.5), parts.blades);
    }
    parts.blades.instanceMatrix.needsUpdate = true;
    // Patas: saem dos lados, para baixo e para trás, remando devagar
    LEGS.forEach(([k, side], l) => {
      const i = Math.round(k * (SEG - 1));
      tmp.tip.copy(tmp.p[i]).addScaledVector(tmp.n[i], side * tmp.r[i] * 0.7).addScaledVector(tmp.b[i], -tmp.r[i] * 0.25);
      const paddle = Math.sin(age * 5 + l * 1.7) * 0.4;
      tmp.v.copy(tmp.b[i]).multiplyScalar(-0.6).addScaledVector(tmp.n[i], side * 0.8).addScaledVector(tmp.t[i], -0.35 + paddle).normalize();
      tmp.w.copy(tmp.t[i]).multiplyScalar(side);
      placeBasis(l, tmp.tip, tmp.v, tmp.w.cross(tmp.v), 1.05 + tmp.r[i] * 1.2, parts.legs);
    });
    parts.legs.instanceMatrix.needsUpdate = true;

    // A cabeça na ponta do corpo, alinhada ao referencial (o dorso para cima): o focinho aponta
    // para onde ele vai. Ruge no meio da subida
    const head = headRef.current;
    if (head) {
      tmp.x.crossVectors(tmp.b[0], tmp.t[0]).normalize();
      tmp.m.makeBasis(tmp.x, tmp.b[0], tmp.t[0]);
      head.quaternion.setFromRotationMatrix(tmp.m);
      head.position.copy(tmp.p[0]).addScaledVector(tmp.t[0], 0.08);
      const roar = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (age - 1.6) / 0.9))));
      if (jawRef.current) jawRef.current.rotation.x = 0.1 + Math.sin(age * 3) * 0.04 + roar * 0.55;
    }

    // Fitas: crina saindo da nuca e caindo para trás pelo caminho do corpo
    const rpos = parts.ribbonGeo.attributes.position;
    let start = 0;
    for (let m = 0; m < MANE; m += 1) {
      const root = 1.5 + m * 0.9;
      const around = Math.PI * 0.5 + (m % 2 ? 1 : -1) * (0.25 + (m % 4) * 0.22);
      const len = 1.15 - (m / MANE) * 0.35;
      for (let k = 0; k < MANE_PTS; k += 1) {
        const f = root + k * 1.6 * len;
        const i = Math.min(SEG - 1, Math.round(f));
        along(f, tmp.pts[k]);
        const ca = Math.cos(around);
        const sa = Math.sin(around);
        const lift = tmp.r[i] * 0.85 + k * 0.05 * len;
        tmp.pts[k].addScaledVector(tmp.n[i], ca * lift).addScaledVector(tmp.b[i], sa * lift);
        tmp.pts[k].addScaledVector(tmp.n[i], Math.sin(age * 8 - k * 0.8 + m) * 0.025 * k);
        tmp.widths[k] = (0.075 - k * 0.006) * len;
      }
      writeRibbon(rpos, start, MANE_PTS);
      start += MANE_PTS;
    }
    // Bigodes: saem do focinho e seguem o caminho, abrindo para os lados e ondulando
    for (const side of [-1, 1]) {
      tmp.tip.set(side * 0.13, 0.08, 0.9).multiplyScalar(1.08).applyQuaternion(head.quaternion).add(head.position);
      for (let k = 0; k < WHISKER_PTS; k += 1) {
        const f = k * 1.35;
        const i = Math.min(SEG - 1, Math.round(f));
        along(f, tmp.pts[k]).sub(tmp.p[0]).add(tmp.tip);
        const spread = k * 0.045;
        const wave = Math.sin(age * 6 - k * 0.55 + side) * 0.012 * k;
        tmp.pts[k].addScaledVector(tmp.n[i], side * spread).addScaledVector(tmp.b[i], wave - k * 0.01);
        tmp.widths[k] = 0.022 * (1 - k / WHISKER_PTS) + 0.004;
      }
      writeRibbon(rpos, start, WHISKER_PTS);
      start += WHISKER_PTS;
    }
    // Flâmulas da cauda: continuam o caminho antigo, abrindo
    const tailT = t0 - (SEG - 1) * DRAGON.length * (1 + (SEG - 1) * 0.007);
    for (const side of [-1, 1]) {
      for (let k = 0; k < STREAMER_PTS; k += 1) {
        headAt(tailT - k * 0.035, tmp.pts[k]);
        tmp.pts[k].addScaledVector(tmp.n[SEG - 1], side * k * 0.03).addScaledVector(tmp.b[SEG - 1], Math.sin(age * 7 - k * 0.7) * 0.02 * k);
        tmp.widths[k] = 0.05 * (1 - k / STREAMER_PTS) + 0.01;
      }
      writeRibbon(rpos, start, STREAMER_PTS);
      start += STREAMER_PTS;
    }
    rpos.needsUpdate = true;
    // Rastro de luz: o caminho que a cauda já percorreu
    for (let k = 0; k < TRAIL_PTS; k += 1) {
      headAt(tailT + 0.15 - k * 0.05, tmp.pts[k]);
      tmp.widths[k] = 0.32 * (1 - k / TRAIL_PTS) * born;
    }
    writeRibbon(parts.trailGeo.attributes.position, 0, TRAIL_PTS);
    parts.trailGeo.attributes.position.needsUpdate = true;

    // A pérola (宝珠) que ele persegue, girando à frente do focinho
    const lead = fx.pearl.list[0];
    headAt(t0 + 0.32, lead.p);
    lead.p.y += Math.sin(age * 3) * 0.08;
    lead.life = born * (1 - Math.min(1, Math.max(0, (age - d0 + 0.3) / 0.6)));
    fx.halo.list[0].p.copy(lead.p);
    fx.halo.list[0].life = lead.life * (0.8 + Math.sin(age * 4) * 0.2);
    flushPoints(fx.pearl, dt, 0, 0);
    flushPoints(fx.halo, dt, 0, 0);

    // Faíscas soltas pelo corpo que flutuam e apagam; na dissolução, brasas subindo da borda
    if (alive && dissolve === 0) {
      for (let s = 0; s < 3; s += 1) {
        const i = Math.floor(Math.random() * SEG * 0.85);
        tmp.v.set((Math.random() - 0.5) * 0.8, 0.3 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8);
        emit(fx.sparks, tmp.p[i], tmp.v);
      }
    }
    if (dissolve > 0 && dissolve < 1) {
      const edgeI = Math.round((1 - Math.min(1, dissolve * 1.15 / 0.85)) * (SEG - 1));
      for (let s = 0; s < 9; s += 1) {
        const i = Math.min(SEG - 1, Math.max(0, edgeI + Math.floor((Math.random() - 0.3) * 8)));
        tmp.v.set((Math.random() - 0.5) * 1.2, 0.6 + Math.random() * 1.1, (Math.random() - 0.5) * 1.2);
        tmp.tip.copy(tmp.p[i]).addScaledVector(tmp.n[i], (Math.random() - 0.5) * tmp.r[i] * 2);
        emit(fx.embers, tmp.tip, tmp.v, 0.7 + Math.random() * 0.3);
      }
    }
    flushPoints(fx.sparks, dt, 0, 1.0);
    flushPoints(fx.embers, dt, -0.6, 0.9, 1.2);
  });

  const dragon = { dragon: true };
  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={koiRef} geometry={koiGeometry()} material={fx.koiMat} renderOrder={4} frustumCulled={false} />
      {fx.ringMats.map((m, i) => (
        <mesh key={i} ref={(el) => { ringRefs.current[i] = el; }} geometry={fx.ringGeo} material={m} position={[0, 0.03, 0]} renderOrder={3} frustumCulled={false} />
      ))}
      <mesh geometry={column.geometry} material={column.material} renderOrder={3} frustumCulled={false} />
      <mesh geometry={body.geometry} material={body.material} frustumCulled={false} userData={dragon} />
      <primitive object={parts.blades} userData={dragon} />
      <primitive object={parts.legs} userData={dragon} />
      <group ref={headRef} userData={dragon}>
        <mesh geometry={dragonHead()} material={body.facetMat} frustumCulled={false} scale={1.08} />
        <mesh ref={jawRef} geometry={dragonJaw()} material={body.facetMat} frustumCulled={false} position={[0, -0.14, 0.11]} scale={1.08} />
      </group>
      <mesh geometry={parts.ribbonGeo} material={parts.ribbonMat} renderOrder={5} frustumCulled={false} userData={dragon} />
      <mesh geometry={parts.trailGeo} material={parts.trailMat} renderOrder={5} frustumCulled={false} userData={dragon} />
      <primitive object={fx.mist.points} />
      <primitive object={fx.drops.points} />
      <primitive object={fx.sparks.points} />
      <primitive object={fx.embers.points} />
      <primitive object={fx.halo.points} />
      <primitive object={fx.pearl.points} />
      <primitive object={fx.flash.points} />
    </group>
  );
}
