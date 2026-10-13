'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, ConeGeometry, CylinderGeometry, DoubleSide, Matrix4, PlaneGeometry,
  Quaternion, Raycaster, ShaderMaterial, SphereGeometry, Vector2, Vector3,
} from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { journeyStore } from '../../store/journey';
import { CROW, CROW_CAW, setCrowHitTester } from '../../lib/crow';
import { sceneHeight, toNdc } from '../../lib/pointer';

// 八咫烏 (Yatagarasu): o corvo de três pernas, mensageiro do sol que guia os perdidos. Quando a
// pessoa fica um tempo parada na hero, ele chega voando, pousa no alto do torii e fica ali, vivo
// (vira a cabeça, ajeita as penas, dá um pulinho); clicado, grasna e dá uma dica (ver CrowHint).
// Se a pessoa rola para longe, ele vai embora. Preto com o brilho iridescente das penas de corvo,
// olhos com um brilho âmbar, as três pernas agarradas na viga e um halo dourado sutil atrás (o sol)
// Coordenadas: as do torii (o grupo é posto no topo do kasagi); frente do corvo em +z, pés em y = 0

const vertexShader = /* glsl */ `
  attribute float aKind;
  varying float vKind;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  void main() {
    vKind = aKind;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uDay;
  varying float vKind;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  void main() {
    vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 L = normalize(vec3(-0.35, 0.85, 0.4));
    float wrap = max((dot(N, L) + 0.4) / 1.4, 0.0);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
    float spec = pow(max(dot(N, normalize(L + V)), 0.0), 40.0);
    vec3 col;
    if (vKind < 0.5) {
      // Pena de corvo: quase preta, com o brilho azul-violeta-verde que muda com o ângulo
      vec3 base = vec3(0.016, 0.016, 0.024) * (0.6 + 0.8 * wrap);
      vec3 sheen = 0.5 + 0.5 * cos(6.2832 * (fres * 0.9 + vec3(0.62, 0.72, 0.85)));
      col = base + sheen * fres * 0.32 + vec3(0.55, 0.6, 0.85) * spec * 0.35;
      col += vec3(0.04, 0.05, 0.08) * uDay * wrap;
    } else if (vKind < 1.5) {
      // Bico e pernas: cinza-chumbo
      col = vec3(0.05, 0.05, 0.055) * (0.5 + 0.9 * wrap) + vec3(0.6) * spec * 0.5 + vec3(0.25, 0.28, 0.35) * fres * 0.25;
    } else {
      // Olho: escuro e brilhante, com a íris âmbar acesa (o mensageiro do sol)
      col = vec3(1.6, 0.75, 0.15) * 0.9 + vec3(1.0) * spec * 1.5;
    }
    gl_FragColor = vec4(col, uOpacity);
    #include <colorspace_fragment>
  }
`;
const haloFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv * 2.0 - 1.0;
    float d = length(c);
    // Disco do sol bem suave e um anel fino em volta
    float disc = smoothstep(1.0, 0.0, d) * 0.35;
    float ring = exp(-pow((d - 0.78) * 14.0, 2.0)) * 0.6;
    gl_FragColor = vec4(vec3(1.0, 0.72, 0.28) * (disc + ring), (disc + ring) * uOpacity);
  }
`;
const haloVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const K = { FEATHER: 0, BEAK: 1, EYE: 2 };
const UP = new Vector3(0, 1, 0);

// Peça com o tipo; base na origem apontando para `dir`, depois movida para `root`
function piece(geometry, kind, { scale, root = [0, 0, 0], dir, rotX = 0 } = {}) {
  let g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (g.attributes.normal) g.deleteAttribute('normal');
  if (scale) g.scale(...scale);
  if (rotX) g.rotateX(rotX);
  if (dir) {
    g.computeBoundingBox();
    g.translate(0, -g.boundingBox.min.y, 0);
    g.applyMatrix4(new Matrix4().makeRotationFromQuaternion(new Quaternion().setFromUnitVectors(UP, new Vector3(...dir).normalize())));
  }
  g.translate(...root);
  g.setAttribute('aKind', new BufferAttribute(new Float32Array(g.attributes.position.count).fill(kind), 1));
  return g;
}
function join(pieces) {
  const g = mergeVertices(mergeGeometries(pieces), 1e-4);
  g.computeVertexNormals();
  return g;
}
// Pena: lâmina ao longo de +y, larga no meio e pontuda, com uma quina (a raque)
function feather(len, width, bend = 0.12) {
  const pos = [];
  const index = [];
  const steps = 8;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const w = width * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) * (1 - t * 0.35);
    const y = t * len;
    const z = -t * t * len * bend;
    pos.push(-w / 2, y, z, 0, y, z + w * 0.12, w / 2, y, z);
    if (i < steps) {
      const a = i * 3;
      index.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(index);
  return g;
}
const sphere = (r, w = 16, h = 12) => new SphereGeometry(r, w, h);

// Corpo, cabeça, bico de cima, olhos, cauda em leque e as três pernas com os dedos agarrando
let bodyCache = null;
function crowBody() {
  if (bodyCache) return bodyCache;
  const parts = [
    piece(sphere(0.3), K.FEATHER, { scale: [0.76, 0.8, 1.48], rotX: -0.28, root: [0, 0.46, -0.06] }),
    piece(sphere(0.2), K.FEATHER, { scale: [0.92, 1.0, 0.95], root: [0, 0.52, 0.2] }),
    // O pescoço, que a cabeça (à parte, ver crowHead) encobre
    piece(sphere(0.14), K.FEATHER, { scale: [0.9, 1.05, 1.05], root: [0, 0.7, 0.28] }),
  ];
  // Cauda em leque, para trás e para baixo
  for (let i = 0; i < 7; i += 1) {
    const x = (i - 3) * 0.035;
    parts.push(piece(feather(0.55 - Math.abs(i - 3) * 0.04, 0.17, 0.06), K.FEATHER, { root: [x, 0.38, -0.42], dir: [x * 2.6, -0.3, -1] }));
  }
  // O corpo fica mais alto que os pés: as três pernas aparecem inteiras
  parts.forEach((g) => g.translate(0, LIFT, 0));
  // 三本足: as três pernas, cada uma com três dedos para a frente e um para trás
  // Espalhadas ao longo do corpo: de perfil as três aparecem
  [[-0.07, -0.1], [0, 0.02], [0.07, 0.13]].forEach(([x, z]) => {
    parts.push(piece(new CylinderGeometry(0.015, 0.022, 0.38, 8), K.BEAK, { root: [x, 0.0, z], dir: [0, 1, -0.15] }));
    parts.push(piece(sphere(0.026, 8, 6), K.BEAK, { root: [x, 0.36, z - 0.05] }));
    [-0.45, 0, 0.45].forEach((a) => parts.push(piece(new ConeGeometry(0.013, 0.1, 6), K.BEAK, { root: [x, 0.012, z], dir: [Math.sin(a), -0.15, Math.cos(a)] })));
    parts.push(piece(new ConeGeometry(0.012, 0.08, 6), K.BEAK, { root: [x, 0.012, z], dir: [0, -0.15, -1] }));
  });
  bodyCache = join(parts);
  return bodyCache;
}
// Cabeça (pivô na origem, vira e sobe no grasnado): crânio, bico de cima grosso com a ponta curvada,
// olhos e as penas eriçadas da garganta
let headCache = null;
function crowHead() {
  if (headCache) return headCache;
  const parts = [
    piece(sphere(0.16), K.FEATHER, { scale: [0.88, 0.9, 1.15] }),
    piece(new ConeGeometry(0.068, 0.36, 10), K.BEAK, { scale: [0.7, 1, 1.2], root: [0, -0.015, 0.12], dir: [0, -0.2, 1] }),
    ...[-0.05, 0, 0.05].map((x) => piece(feather(0.18, 0.08, 0.2), K.FEATHER, { root: [x, -0.1, 0.05], dir: [x * 2, -1, 0.35] })),
  ];
  for (const sx of [-1, 1]) parts.push(piece(sphere(0.026, 10, 8), K.EYE, { root: [sx * 0.11, 0.035, 0.07] }));
  headCache = join(parts);
  return headCache;
}
// Bico de baixo (abre no grasnado), dobradiça na origem
let jawCache = null;
function crowJaw() {
  if (jawCache) return jawCache;
  jawCache = join([piece(new ConeGeometry(0.055, 0.26, 10), K.BEAK, { scale: [0.75, 1, 0.6], dir: [0, -0.32, 1] })]);
  return jawCache;
}
// Asa (a direita; a esquerda é a mesma espelhada): o braço coberto e as rêmiges abrindo em leque,
// ao longo de +x a partir do ombro (aberta); fechada ela gira para trás, colada ao corpo
let wingCache = null;
function crowWing() {
  if (wingCache) return wingCache;
  const parts = [piece(sphere(0.12, 12, 8), K.FEATHER, { scale: [2.2, 0.32, 1.15], root: [0.2, 0, -0.02] })];
  for (let i = 0; i < 7; i += 1) {
    const a = -0.12 + i * 0.09;
    parts.push(piece(feather(0.3 + i * 0.025, 0.14, 0.04), K.FEATHER, { root: [0.28 + i * 0.025, -0.005 * i, -0.03], dir: [Math.cos(a), -0.05, -Math.sin(a) - 0.18] }));
  }
  wingCache = join(parts);
  return wingCache;
}

const PERCH_TOP = 9.64;
// Quanto o corpo fica acima dos pés
const LIFT = 0.14;
const SCALE = 2.6;
// Chegada: de cima e da direita até o pouso; saída: para cima e para a esquerda (coordenadas do torii)
const ARRIVE = { from: new Vector3(9, 7, 6), via: new Vector3(4, 4.5, -3), duration: 2.1 };
const LEAVE = { to: new Vector3(-10, 9, 4), via: new Vector3(-3, 3.5, -2), duration: 1.7 };
const bezier = (a, b, c, t, out) => out.set(0, 0, 0).addScaledVector(a, (1 - t) ** 2).addScaledVector(b, 2 * (1 - t) * t).addScaledVector(c, t * t);

export default function Yatagarasu({ position, rotationY }) {
  const camera = useThree((s) => s.camera);
  const groupRef = useRef(null);
  const birdRef = useRef(null);
  const headRef = useRef(null);
  const jawRef = useRef(null);
  const wingR = useRef(null);
  const wingL = useRef(null);
  const haloRef = useRef(null);
  const state = useRef({ mode: 'hidden', t: 0, lastActive: performance.now(), caw: -10, hop: 0, nextHop: 5 });

  const material = useMemo(() => new ShaderMaterial({
    vertexShader, fragmentShader, side: DoubleSide, transparent: true, uniforms: { uOpacity: { value: 1 }, uDay: { value: 0 } },
  }), []);
  const halo = useMemo(() => ({
    geometry: new PlaneGeometry(6.4, 6.4),
    material: new ShaderMaterial({ vertexShader: haloVertex, fragmentShader: haloFragment, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { uOpacity: { value: 0 } } }),
  }), []);
  useEffect(() => () => { material.dispose(); halo.geometry.dispose(); halo.material.dispose(); }, [material, halo]);

  // Atividade: rolar, teclar, clicar ou tocar (mexer o mouse para ler não conta)
  useEffect(() => {
    const wake = () => { state.current.lastActive = performance.now(); };
    const events = ['wheel', 'keydown', 'pointerdown', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    const onCaw = () => { state.current.caw = performance.now() / 1000; };
    window.addEventListener(CROW_CAW, onCaw);
    return () => {
      events.forEach((e) => window.removeEventListener(e, wake));
      window.removeEventListener(CROW_CAW, onCaw);
    };
  }, []);

  // Clique: a página pergunta se acertou o corvo pousado
  useEffect(() => {
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    return setCrowHitTester((clientX, clientY) => {
      const s = state.current;
      if (!birdRef.current || (s.mode !== 'perched' && s.mode !== 'landing')) return false;
      const { x, y } = toNdc(clientX, clientY, window.innerWidth, sceneHeight());
      raycaster.setFromCamera(ndc.set(x, y), camera);
      // Folga: uma esfera em volta do corpo (o corvo é pequeno na tela)
      const center = birdRef.current.getWorldPosition(new Vector3()).add(new Vector3(0, (0.6 + LIFT) * SCALE, 0));
      return raycaster.ray.distanceSqToPoint(center) < (0.9 * SCALE) ** 2;
    });
  }, [camera]);

  const tmp = useMemo(() => ({ p: new Vector3(), q: new Vector3(), perch: new Vector3(0, PERCH_TOP, 0) }), []);

  useFrame((_, delta) => {
    const s = state.current;
    const bird = birdRef.current;
    if (!bird) return;
    const now = performance.now();
    const time = now / 1000;
    const dt = Math.min(delta, 1 / 20);
    const journey = journeyStore.getState();
    const atHero = journey.route === 'journey' && journey.progress < CROW.heroProgress;
    material.uniforms.uDay.value += ((journey.theme === 'day' ? 1 : 0) - material.uniforms.uDay.value) * Math.min(1, dt * 3);

    if (s.mode === 'hidden') {
      bird.visible = false;
      haloRef.current.visible = false;
      if (atHero && now - s.lastActive > CROW.idleMs) {
        s.mode = journey.reducedMotion ? 'perched' : 'arriving';
        s.t = 0;
      }
      return;
    }
    bird.visible = true;
    haloRef.current.visible = true;
    s.t += dt;
    // Foi embora da hero: ele levanta voo
    if ((s.mode === 'perched' || s.mode === 'landing') && !atHero) {
      s.mode = journey.reducedMotion ? 'hidden' : 'leaving';
      s.t = 0;
    }

    let flap = 0;
    let open = 0;
    if (s.mode === 'arriving') {
      const k = Math.min(1, s.t / ARRIVE.duration);
      const e = 1 - (1 - k) ** 2.2;
      bezier(ARRIVE.from, ARRIVE.via, tmp.perch, e, tmp.p);
      bezier(ARRIVE.from, ARRIVE.via, tmp.perch, Math.min(1, e + 0.02), tmp.q);
      bird.position.copy(tmp.p);
      bird.rotation.y = Math.atan2(tmp.q.x - tmp.p.x, tmp.q.z - tmp.p.z);
      bird.rotation.x = 0;
      open = 1;
      flap = Math.sin(time * (k > 0.8 ? 11 : 8)) * (1 - k * 0.3);
      if (k >= 1) { s.mode = 'landing'; s.t = 0; }
    } else if (s.mode === 'leaving') {
      const k = Math.min(1, s.t / LEAVE.duration);
      const e = k ** 1.8;
      bezier(tmp.perch, LEAVE.via, LEAVE.to, e, tmp.p);
      bezier(tmp.perch, LEAVE.via, LEAVE.to, Math.min(1, e + 0.02), tmp.q);
      bird.position.copy(tmp.p);
      bird.rotation.set(0, Math.atan2(tmp.q.x - tmp.p.x, tmp.q.z - tmp.p.z), 0);
      open = 1;
      flap = Math.sin(time * 10);
      if (k >= 1) { s.mode = 'hidden'; s.lastActive = now; }
    } else {
      // Pousado: virado de três quartos para quem chega pelo caminho (a câmera vem de -z)
      bird.position.copy(tmp.perch);
      const settle = s.mode === 'landing' ? Math.min(1, s.t / 0.45) : 1;
      if (s.mode === 'landing' && settle >= 1) s.mode = 'perched';
      open = 1 - settle;
      flap = Math.sin(time * 12) * (1 - settle) * 0.6;
      // Pulinho de vez em quando, trocando o lado para onde olha
      s.nextHop -= dt;
      if (s.nextHop < 0) { s.hop = 1; s.nextHop = 5 + Math.random() * 5; }
      s.hop = Math.max(0, s.hop - dt * 2.5);
      bird.position.y += Math.sin(Math.PI * s.hop) * 0.12;
      bird.rotation.set(0, Math.PI + 1.05 + Math.sin(time * 0.3) * 0.12, 0);
    }

    // Cabeça: olha em volta aos trancos (como os corvos), e no grasnado sobe com o bico aberto
    const cawT = time - s.caw;
    const caw = cawT >= 0 && cawT < 0.7 ? Math.sin(Math.PI * (cawT / 0.7)) : 0;
    if (headRef.current) {
      const look = Math.round(Math.sin(time * 0.7) * 2) / 2;
      headRef.current.rotation.set(-caw * 0.45, look * 0.6, Math.sin(time * 1.3) * 0.05);
    }
    if (jawRef.current) jawRef.current.rotation.x = 0.04 + caw * 0.5;
    if (s.mode === 'perched') bird.position.y -= caw * 0.03;

    // Asas: abertas e batendo no voo, recolhidas para trás pousado (com um ajeitar de penas)
    const fold = 1 - open;
    const ruffle = s.mode === 'perched' ? Math.max(0, Math.sin(time * 0.9)) ** 30 * 0.25 : 0;
    if (wingR.current && wingL.current) {
      wingR.current.rotation.set(0, fold * (Math.PI / 2 + 0.15), flap * 0.9 + ruffle);
      wingL.current.rotation.set(0, -fold * (Math.PI / 2 + 0.15), -(flap * 0.9 + ruffle));
    }

    // O halo do sol: acende no pouso e fica fraco atrás dele
    const haloTarget = s.mode === 'perched' || s.mode === 'landing' ? 0.42 + caw * 0.5 : s.mode === 'arriving' ? 0.15 : 0;
    halo.material.uniforms.uOpacity.value += (haloTarget - halo.material.uniforms.uOpacity.value) * Math.min(1, dt * 3);
    haloRef.current.position.copy(bird.position).add(tmp.q.set(0, 0.6 * SCALE, 0));
    haloRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh ref={haloRef} geometry={halo.geometry} material={halo.material} visible={false} renderOrder={1} />
      <group ref={birdRef} visible={false} scale={SCALE}>
        <mesh geometry={crowBody()} material={material} />
        <group ref={headRef} position={[0, 0.82 + LIFT, 0.34]}>
          <mesh geometry={crowHead()} material={material} />
          <mesh ref={jawRef} geometry={crowJaw()} material={material} position={[0, -0.05, 0.12]} />
        </group>
        <group ref={wingR} position={[0.19, 0.6 + LIFT, 0.1]}>
          <mesh geometry={crowWing()} material={material} />
        </group>
        <group ref={wingL} position={[-0.19, 0.6 + LIFT, 0.1]} scale={[-1, 1, 1]}>
          <mesh geometry={crowWing()} material={material} />
        </group>
      </group>
    </group>
  );
}
