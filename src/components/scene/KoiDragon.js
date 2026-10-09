'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, ConeGeometry, CylinderGeometry, DoubleSide, InstancedMesh, Line,
  LineBasicMaterial, MeshBasicMaterial, Object3D, Points, Quaternion, RingGeometry, ShaderMaterial, SphereGeometry, Vector3,
} from 'three';
import { NOISE } from './glsl';
import { assemble, paint, placed } from './lowpoly';
import { koiGeometry } from './koiGeometry';

// 鯉の滝登り (登竜門): a carpa que vence a cachoeira vira dragão.
//  0,0 s  a carpa dourada salta da água (espirro de gotas e um anel abrindo na superfície)
//  0,5 s  no alto do salto, um clarão dourado: ela vira dragão, e a água sobe atrás numa coluna
//         (a cachoeira que ela venceu)
//  0,5–5,4 s o dragão sobe em espiral: corpo com escamas no dorso e placas claras na barriga, a
//         crista de espinhos vermelhos, quatro patas com garras, a cauda em leque e os bigodes
//         esvoaçando; uma onda de luz corre pelo corpo. No fim ele some no céu
// Só existe enquanto acontece; coordenadas do rio (o grupo cresce com a distância da câmera)
export const DRAGON = { duration: 5.6, segments: 52, sides: 10, length: 0.032, rise: 0.5 };

const SEG = DRAGON.segments;
const SIDES = DRAGON.sides;
const SPINES = 22;
const FIN = 7;
const LEGS = [[0.2, 1], [0.2, -1], [0.52, 1], [0.52, -1]];
const WHISKER = 16;

// A cabeça: sai do clarão (acima da água) e sobe em espiral que abre, acelerando no fim
function headAt(t, out) {
  const u = Math.max(0, t);
  const theta = u * 3.2;
  const radius = 0.4 + u * 0.6;
  const y = 1.0 + 1.15 * u ** 1.15 + Math.max(0, u - 3.4) ** 2 * 2.6;
  return out.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
}

const bodyVertex = /* glsl */ `
  attribute vec2 aUv;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;
  void main() {
    vUv = aUv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const bodyFragment = /* glsl */ `
  uniform float uFade;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;
  ${NOISE}
  void main() {
    // v: 0,25 é o dorso, 0,75 a barriga (em volta do corpo); u: da cabeça (0) à cauda (1)
    float back = smoothstep(0.32, 0.0, abs(vUv.y - 0.25));
    float belly = smoothstep(0.2, 0.05, abs(vUv.y - 0.75));
    // Escamas em meia-lua sobrepostas, com a borda escura
    vec2 g = vec2(vUv.x * 64.0, vUv.y * 12.0 + floor(vUv.x * 64.0) * 0.5);
    vec2 cell = fract(g) - vec2(0.5, 0.0);
    float rim = smoothstep(0.4, 0.5, length(cell * vec2(1.0, 0.9)));
    vec3 col = mix(vec3(1.0, 0.8, 0.32), vec3(0.72, 0.42, 0.1), rim * 0.75);
    // Dorso mais quente (laranja-avermelhado) e a crina vermelha perto da cabeça
    col = mix(col, vec3(0.95, 0.45, 0.12), back * 0.55);
    col = mix(col, vec3(0.86, 0.12, 0.08), back * smoothstep(0.32, 0.05, vUv.x) * 0.7);
    // Barriga: placas claras em faixas, com as emendas marcadas
    float seam = smoothstep(0.82, 1.0, fract(vUv.x * 52.0));
    col = mix(col, mix(vec3(1.0, 0.94, 0.74), vec3(0.85, 0.66, 0.38), seam), belly);
    // Brilho de borda, um reflexo que corre e a onda de luz que percorre o corpo da cabeça à cauda
    float edge = pow(1.0 - max(dot(normalize(vNormalW), vView), 0.0), 2.2);
    float sheen = pow(vnoise(vec2(vUv.x * 6.0 - uTime * 2.0, vUv.y * 3.0)), 3.0);
    float wave = exp(-pow((vUv.x - fract(uTime * 0.45)) * 9.0, 2.0));
    col = col * (0.82 + sheen * 0.45 + wave * 0.5) + vec3(1.0, 0.86, 0.5) * edge * 0.95;
    float tail = smoothstep(1.0, 0.86, vUv.x);
    gl_FragColor = vec4(col, uFade * tail);
    #include <colorspace_fragment>
  }
`;

const columnVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const columnFragment = /* glsl */ `
  uniform float uTime;
  uniform float uRise;
  uniform float uFade;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    // Água subindo: estrias verticais que correm para cima, espuma branca e o topo desfiado
    float flow = fbm(vec2(vUv.x * 18.0, vUv.y * 3.0 - uTime * 4.5));
    float streak = smoothstep(0.45, 0.85, flow);
    float top = smoothstep(uRise, uRise - 0.18 - flow * 0.12, vUv.y);
    vec3 col = mix(vec3(0.35, 0.62, 0.9), vec3(0.95, 0.98, 1.0), streak);
    float alpha = (0.32 + streak * 0.55) * top * uFade * smoothstep(0.0, 0.08, vUv.y);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

// Pontos genéricos (faíscas douradas, gotas d'água e o clarão): cor e tamanho por uniforme
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
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5 || vLife < 0.01) discard;
    float glow = mix(1.0 - smoothstep(0.35, 0.5, d), pow(1.0 - d * 2.0, 2.0), uSoft);
    gl_FragColor = vec4(uColor * (0.8 + glow * 0.6), glow * vLife);
  }
`;

// Anel abrindo na superfície da água
const ringFragment = /* glsl */ `
  uniform float uFade;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(vec3(0.92, 0.97, 1.0), uFade * (0.5 + 0.5 * vUv.x));
  }
`;

// Cabeça do dragão, low-poly como o resto da cena (frente em +z): crânio, focinho com o maxilar e as
// presas, os chifres de cervo para trás, olhos vermelhos, a crina em chamas e a barbicha
const GOLD = [1, 0.78, 0.3];
const LIGHT = [1, 0.9, 0.62];
const HORN = [0.98, 0.92, 0.78];
const RED = [0.9, 0.16, 0.1];
let headCache = null;
function dragonHead() {
  if (headCache) return headCache;
  const cyl = (rt, rb, h, color, at) => placed(paint(new CylinderGeometry(rt, rb, h, 7), color), at);
  const cone = (r, h, color, at) => placed(paint(new ConeGeometry(r, h, 6), color), at);
  const ball = (r, scale, color, at) => {
    const g = paint(new SphereGeometry(r, 10, 8), color);
    g.scale(...scale);
    return placed(g, at);
  };
  const parts = [
    ball(0.4, [1, 0.82, 1.15], GOLD, {}),
    cyl(0.2, 0.3, 0.72, LIGHT, { z: 0.52, y: -0.04, rotX: Math.PI / 2 }),
    // Narinas no fim do focinho e o maxilar aberto
    ball(0.07, [1, 0.8, 1], GOLD, { x: 0.1, y: 0.04, z: 0.86 }),
    ball(0.07, [1, 0.8, 1], GOLD, { x: -0.1, y: 0.04, z: 0.86 }),
    cyl(0.13, 0.22, 0.58, GOLD, { z: 0.44, y: -0.24, rotX: Math.PI / 2 + 0.28 }),
    cone(0.03, 0.12, HORN, { x: 0.1, y: -0.12, z: 0.74, rotX: Math.PI }),
    cone(0.03, 0.12, HORN, { x: -0.1, y: -0.12, z: 0.74, rotX: Math.PI }),
    ball(0.075, [1, 1, 1], RED, { x: 0.2, y: 0.14, z: 0.32 }),
    ball(0.075, [1, 1, 1], RED, { x: -0.2, y: 0.14, z: 0.32 }),
    // Sobrancelhas grossas sobre os olhos
    ball(0.07, [1.6, 0.6, 1], GOLD, { x: 0.2, y: 0.24, z: 0.28 }),
    ball(0.07, [1.6, 0.6, 1], GOLD, { x: -0.2, y: 0.24, z: 0.28 }),
    // Barbicha
    cone(0.06, 0.4, LIGHT, { y: -0.48, z: 0.36, rotX: Math.PI - 0.5 }),
  ];
  for (const sx of [-1, 1]) {
    // Chifre: haste para trás e para cima, com uma ponta lateral
    parts.push(cyl(0.025, 0.05, 0.8, HORN, { x: sx * 0.16, y: 0.44, z: -0.34, rotX: -0.9, rotZ: -sx * 0.25 }));
    parts.push(cone(0.03, 0.28, HORN, { x: sx * 0.27, y: 0.58, z: -0.38, rotX: -0.4, rotZ: -sx * 0.9 }));
  }
  // Crina: chamas vermelhas atrás do crânio
  [[0, 0.32, -0.42, 0.14], [0.2, 0.2, -0.46, 0.11], [-0.2, 0.2, -0.46, 0.11], [0, 0.06, -0.52, 0.12], [0.14, 0.42, -0.36, 0.08], [-0.14, 0.42, -0.36, 0.08]]
    .forEach(([x, y, z, r]) => parts.push(cone(r, 0.55, RED, { x, y, z, rotX: -1.9 })));
  headCache = assemble(parts);
  return headCache;
}

// Pata: coxa, antebraço e três garras, ao longo de +y a partir da junta
let legCache = null;
function dragonLeg() {
  if (legCache) return legCache;
  const cyl = (rt, rb, h, color, at) => placed(paint(new CylinderGeometry(rt, rb, h, 6), color), at);
  const cone = (r, h, color, at) => placed(paint(new ConeGeometry(r, h, 5), color), at);
  const parts = [
    cyl(0.07, 0.1, 0.32, GOLD, { y: 0.16 }),
    cyl(0.05, 0.07, 0.26, LIGHT, { y: 0.4, z: 0.04, rotX: 0.35 }),
  ];
  [-0.05, 0, 0.05].forEach((x) => parts.push(cone(0.022, 0.12, HORN, { x, y: 0.58, z: 0.12, rotX: 1.1 })));
  legCache = assemble(parts);
  return legCache;
}

export default function KoiDragon({ at, onDone }) {
  const startRef = useRef(performance.now() / 1000);
  const groupRef = useRef(null);
  const sized = useRef(false);
  const koiRef = useRef(null);
  const headRef = useRef(null);
  const ringRef = useRef(null);

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
    const material = new ShaderMaterial({
      vertexShader: bodyVertex,
      fragmentShader: bodyFragment,
      transparent: true,
      side: DoubleSide,
      uniforms: { uFade: { value: 0 }, uTime: { value: 0 } },
    });
    return { geometry, material };
  }, []);

  const column = useMemo(() => {
    const geometry = new CylinderGeometry(0.7, 1.1, 9, 24, 1, true);
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

  // Peças pequenas que acompanham o corpo: crista, leque da cauda e as quatro patas
  const parts = useMemo(() => {
    const goldMat = new MeshBasicMaterial({ vertexColors: true, transparent: true });
    const spineGeo = assemble([placed(paint(new ConeGeometry(0.07, 0.28, 4), RED), { y: 0.14 })]);
    const spines = new InstancedMesh(spineGeo, goldMat, SPINES + FIN);
    const legs = new InstancedMesh(dragonLeg(), goldMat, LEGS.length);
    spines.frustumCulled = false;
    legs.frustumCulled = false;
    const whiskerMat = new LineBasicMaterial({ color: '#ffe7a8', transparent: true });
    const whiskers = [0, 1].map(() => {
      const g = new BufferGeometry();
      g.setAttribute('position', new BufferAttribute(new Float32Array(WHISKER * 3), 3));
      const line = new Line(g, whiskerMat);
      line.frustumCulled = false;
      return line;
    });
    return { goldMat, spineGeo, spines, legs, whiskerMat, whiskers };
  }, []);

  // O salto da carpa e os efeitos de água e luz
  const fx = useMemo(() => {
    const koiMat = new MeshBasicMaterial({ color: '#f2b23a', transparent: true });
    const ringGeo = new RingGeometry(0.46, 0.52, 56);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new ShaderMaterial({
      vertexShader: columnVertex, fragmentShader: ringFragment, transparent: true, depthWrite: false, uniforms: { uFade: { value: 0 } },
    });
    const makePoints = (n, color, size, soft, additive) => {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
      geometry.setAttribute('aLife', new BufferAttribute(new Float32Array(n), 1));
      const material = new ShaderMaterial({
        vertexShader: pointVertex,
        fragmentShader: pointFragment,
        transparent: true,
        depthWrite: false,
        blending: additive ? AdditiveBlending : undefined,
        uniforms: { uColor: { value: color }, uSize: { value: size }, uSoft: { value: soft } },
      });
      const points = new Points(geometry, material);
      points.frustumCulled = false;
      const list = Array.from({ length: n }, () => ({ p: new Vector3(), v: new Vector3(), life: 0 }));
      return { geometry, material, points, list, next: 0 };
    };
    const sparks = makePoints(110, new Vector3(1, 0.8, 0.42), 9, 1, true);
    const drops = makePoints(70, new Vector3(0.85, 0.94, 1), 7, 0, false);
    const flash = makePoints(1, new Vector3(1, 0.88, 0.55), 520, 1, true);
    return { koiMat, ringGeo, ringMat, sparks, drops, flash };
  }, []);

  useEffect(() => () => {
    [body, column].forEach((x) => { x.geometry.dispose(); x.material.dispose(); });
    parts.goldMat.dispose();
    parts.spineGeo.dispose();
    parts.whiskerMat.dispose();
    parts.whiskers.forEach((l) => l.geometry.dispose());
    fx.koiMat.dispose();
    fx.ringGeo.dispose();
    fx.ringMat.dispose();
    [fx.sparks, fx.drops, fx.flash].forEach((x) => { x.geometry.dispose(); x.material.dispose(); });
  }, [body, column, parts, fx]);

  const tmp = useMemo(() => ({
    p: Array.from({ length: SEG }, () => new Vector3()),
    t: Array.from({ length: SEG }, () => new Vector3()),
    n: Array.from({ length: SEG }, () => new Vector3()),
    b: Array.from({ length: SEG }, () => new Vector3()),
    r: new Float32Array(SEG),
    up: new Vector3(0, 1, 0),
    fwd: new Vector3(0, 0, 1),
    v: new Vector3(),
    q: new Quaternion(),
    o: new Object3D(),
  }), []);

  // Gotas do espirro do salto (uma vez, no começo)
  useEffect(() => {
    fx.drops.list.forEach((d) => {
      const a = Math.random() * Math.PI * 2;
      const s = 0.8 + Math.random() * 1.8;
      d.p.set(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15);
      d.v.set(Math.cos(a) * s * 0.6, 2.2 + Math.random() * 2.4, Math.sin(a) * s * 0.6);
      d.life = 1;
    });
  }, [fx]);

  const emit = (pool, at, velocity, life = 1) => {
    const item = pool.list[pool.next];
    pool.next = (pool.next + 1) % pool.list.length;
    item.p.copy(at);
    item.v.copy(velocity);
    item.life = life;
  };
  const flushPoints = (pool, dt, gravity, decay) => {
    const pos = pool.geometry.attributes.position;
    const life = pool.geometry.attributes.aLife;
    pool.list.forEach((item, i) => {
      if (item.life > 0) {
        item.v.y -= gravity * dt;
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

  useFrame((state, delta) => {
    const age = performance.now() / 1000 - startRef.current;
    if (age > DRAGON.duration) {
      onDone();
      return;
    }
    state.invalidate();
    const dt = Math.min(delta, 1 / 20);
    // Visto de longe (da Experiência o rio fica lá atrás), o dragão cresce para ter presença
    if (!sized.current && groupRef.current) {
      sized.current = true;
      const world = groupRef.current.getWorldPosition(new Vector3());
      groupRef.current.scale.setScalar(Math.min(5, Math.max(1, world.distanceTo(state.camera.position) / 11)));
    }

    // O salto: a carpa sai da água num arco, de nariz para cima, e some no clarão
    const koi = koiRef.current;
    if (koi) {
      const k = Math.min(1, age / DRAGON.rise);
      koi.visible = age < DRAGON.rise;
      koi.position.set(0, -0.2 + Math.sin(k * Math.PI * 0.5) * 1.25, 0);
      koi.rotation.set(-1.25 + k * 0.4, k * 2.2, Math.sin(k * 9) * 0.15);
      koi.scale.setScalar(1.5 * (1 - Math.max(0, (k - 0.85) / 0.15) * 0.6));
    }
    // Anel na água e o espirro (gravidade puxa as gotas de volta)
    const ringT = Math.min(1, age / 1.3);
    fx.ringMat.uniforms.uFade.value = (1 - ringT) ** 2 * 0.55;
    if (ringRef.current) ringRef.current.scale.setScalar(1 + (1 - (1 - ringT) ** 3) * 5);
    flushPoints(fx.drops, dt, 6.5, 0.6);
    // O clarão da transformação
    const flashT = (age - DRAGON.rise + 0.08) / 0.55;
    fx.flash.list[0].p.set(0, 1.0, 0);
    fx.flash.list[0].life = flashT > 0 && flashT < 1 ? Math.sin(Math.PI * flashT) : 0;
    flushPoints(fx.flash, dt, 0, 0);

    // A coluna: sobe logo depois do salto, segura enquanto o dragão sai, e desaba
    const colAge = age - 0.25;
    const rise = Math.min(1, Math.max(0, colAge / 0.5)) * (1 - Math.max(0, (colAge - 2.0) / 0.9));
    column.material.uniforms.uTime.value = age;
    column.material.uniforms.uRise.value = Math.max(0, rise);
    column.material.uniforms.uFade.value = Math.max(0, 1 - Math.max(0, colAge - 2.4) / 0.6);

    // O corpo: cada anel é a cabeça um pouco antes no tempo (o corpo segue o caminho dela)
    const t0 = age - DRAGON.rise;
    for (let i = 0; i < SEG; i += 1) headAt(t0 - i * DRAGON.length * (1 + i * 0.012), tmp.p[i]);
    for (let i = 0; i < SEG; i += 1) {
      const a = tmp.p[Math.max(0, i - 1)];
      const b = tmp.p[Math.min(SEG - 1, i + 1)];
      tmp.t[i].subVectors(a, b).normalize();
      tmp.n[i].crossVectors(tmp.t[i], tmp.up).normalize();
      if (tmp.n[i].lengthSq() < 0.01) tmp.n[i].set(1, 0, 0);
      tmp.b[i].crossVectors(tmp.n[i], tmp.t[i]).normalize();
      const k = i / (SEG - 1);
      // Pescoço fino saindo da cabeça, peito cheio e a cauda afinando, com uma ondulação
      const profile = k < 0.1 ? 0.6 + 0.4 * (k / 0.1) : (1 - (k - 0.1) / 0.9) ** 0.8;
      tmp.r[i] = (0.33 * profile + 0.012) * (1 + Math.sin(k * 22 - age * 10) * 0.05);
    }
    const pos = body.geometry.attributes.position;
    const nor = body.geometry.attributes.normal;
    for (let i = 0; i < SEG; i += 1) {
      for (let j = 0; j < SIDES; j += 1) {
        const ang = (j / SIDES) * Math.PI * 2;
        const cx = Math.cos(ang);
        const cy = Math.sin(ang);
        const nx = tmp.n[i].x * cx + tmp.b[i].x * cy;
        const ny = tmp.n[i].y * cx + tmp.b[i].y * cy;
        const nz = tmp.n[i].z * cx + tmp.b[i].z * cy;
        const idx = i * SIDES + j;
        pos.setXYZ(idx, tmp.p[i].x + nx * tmp.r[i], tmp.p[i].y + ny * tmp.r[i], tmp.p[i].z + nz * tmp.r[i]);
        nor.setXYZ(idx, nx, ny, nz);
      }
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    body.geometry.computeBoundingSphere();
    body.material.uniforms.uTime.value = age;
    const fade = Math.min(1, Math.max(0, (age - DRAGON.rise) / 0.25)) * (1 - Math.max(0, (age - 4.6) / 1.0));
    body.material.uniforms.uFade.value = fade;
    parts.goldMat.opacity = fade;
    parts.whiskerMat.opacity = fade * 0.9;

    // Crista: espinhos no dorso, inclinados para trás, maiores no meio
    const o = tmp.o;
    for (let s = 0; s < SPINES; s += 1) {
      const i = Math.round(4 + (s / (SPINES - 1)) * (SEG * 0.86 - 4));
      o.position.copy(tmp.p[i]).addScaledVector(tmp.b[i], tmp.r[i] * 0.92);
      tmp.v.copy(tmp.b[i]).addScaledVector(tmp.t[i], -0.7).normalize();
      o.quaternion.setFromUnitVectors(tmp.up, tmp.v);
      o.scale.setScalar(0.5 + tmp.r[i] * 2.4);
      o.updateMatrix();
      parts.spines.setMatrixAt(s, o.matrix);
    }
    // Leque da cauda: espinhos abrindo do dorso para a barriga, no fim do corpo
    const tailI = SEG - 4;
    for (let f = 0; f < FIN; f += 1) {
      const a = -0.9 + (f / (FIN - 1)) * 1.8;
      o.position.copy(tmp.p[tailI]);
      tmp.v.copy(tmp.b[tailI]).multiplyScalar(Math.sin(a)).addScaledVector(tmp.t[tailI], -Math.cos(a) * 1.4).normalize();
      o.quaternion.setFromUnitVectors(tmp.up, tmp.v);
      o.scale.set(1.6, 2.4 - Math.abs(a) * 0.8, 1.6);
      o.updateMatrix();
      parts.spines.setMatrixAt(SPINES + f, o.matrix);
    }
    parts.spines.instanceMatrix.needsUpdate = true;
    // Patas: saem dos lados, para baixo e para trás, remando devagar
    LEGS.forEach(([k, side], l) => {
      const i = Math.round(k * (SEG - 1));
      o.position.copy(tmp.p[i]).addScaledVector(tmp.n[i], side * tmp.r[i] * 0.8);
      const paddle = Math.sin(age * 5 + l * 1.7) * 0.35;
      tmp.v.copy(tmp.b[i]).multiplyScalar(-0.7).addScaledVector(tmp.n[i], side * 0.8).addScaledVector(tmp.t[i], -0.4 + paddle).normalize();
      o.quaternion.setFromUnitVectors(tmp.up, tmp.v);
      o.scale.setScalar(1.1 + tmp.r[i]);
      o.updateMatrix();
      parts.legs.setMatrixAt(l, o.matrix);
    });
    parts.legs.instanceMatrix.needsUpdate = true;
    // Bigodes: dois fios saindo do focinho, seguindo o caminho e abrindo para os lados
    parts.whiskers.forEach((line, w) => {
      const side = w ? 1 : -1;
      const wp = line.geometry.attributes.position;
      for (let i = 0; i < WHISKER; i += 1) {
        const at = tmp.p[Math.min(SEG - 1, i)];
        const spread = 0.18 + i * 0.05;
        const wave = Math.sin(age * 6 - i * 0.6) * 0.06 * i * 0.2;
        wp.setXYZ(i, at.x + tmp.n[0].x * side * spread + tmp.b[0].x * (wave - 0.05),
          at.y + tmp.n[0].y * side * spread + tmp.b[0].y * (wave - 0.05),
          at.z + tmp.n[0].z * side * spread + tmp.b[0].z * (wave - 0.05));
      }
      wp.needsUpdate = true;
    });

    // A cabeça na ponta do corpo, olhando para onde ele vai
    if (headRef.current) {
      tmp.v.subVectors(tmp.p[0], tmp.p[1]);
      if (tmp.v.lengthSq() > 1e-6) headRef.current.quaternion.setFromUnitVectors(tmp.fwd, tmp.v.normalize());
      headRef.current.position.copy(tmp.p[0]);
      headRef.current.visible = fade > 0.01;
    }
    parts.spines.visible = fade > 0.01;
    parts.legs.visible = fade > 0.01;

    // Brilho: faíscas soltas pelo corpo, que flutuam e apagam
    if (fade > 0.05 && age < 4.8) {
      for (let s = 0; s < 3; s += 1) {
        const i = Math.floor(Math.random() * SEG * 0.85);
        tmp.v.set((Math.random() - 0.5) * 0.8, 0.3 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8);
        emit(fx.sparks, tmp.p[i], tmp.v);
      }
    }
    flushPoints(fx.sparks, dt, 0, 1.0);
  });

  return (
    <group ref={groupRef} position={at}>
      <mesh ref={koiRef} geometry={koiGeometry()} material={fx.koiMat} renderOrder={4} frustumCulled={false} />
      <mesh ref={ringRef} geometry={fx.ringGeo} material={fx.ringMat} position={[0, 0.03, 0]} renderOrder={3} frustumCulled={false} />
      <mesh geometry={column.geometry} material={column.material} renderOrder={3} frustumCulled={false} />
      <mesh geometry={body.geometry} material={body.material} renderOrder={4} frustumCulled={false} />
      <primitive object={parts.spines} />
      <primitive object={parts.legs} />
      {parts.whiskers.map((line, i) => <primitive key={i} object={line} />)}
      <mesh ref={headRef} geometry={dragonHead()} material={parts.goldMat} renderOrder={5} frustumCulled={false} scale={0.95} />
      <primitive object={fx.drops.points} />
      <primitive object={fx.sparks.points} />
      <primitive object={fx.flash.points} />
    </group>
  );
}
