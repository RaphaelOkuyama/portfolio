'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CatmullRomCurve3, CylinderGeometry, DoubleSide,
  Matrix4, MeshBasicMaterial, NormalBlending, Points, Quaternion, RingGeometry, ShaderMaterial, Vector3, Vector4,
} from 'three';
import { NOISE } from './glsl';
import { koiGeometry } from './koiGeometry';
import { warm } from './warmup';

// 鯉の滝登り (登竜門): a carpa que vence a cachoeira vira dragão. O dragão é o modelo "Lowpoly
// textured Chinese Dragon" de Khyoocumber (Sketchfab, CC BY 4.0, crédito no rodapé), otimizado para
// a web (public/models/dragon.glb). O modelo é estático e reto: a animação é toda daqui, dobrando a
// malha na GPU ao longo de uma coluna que desliza por um trajeto. A coreografia, como um plano de
// cinema (o trajeto é montado em relação à câmera, e o relógio dele acelera e freia):
//  0,0 s  a carpa dourada salta da água (espirro, anéis na superfície, névoa)
//  0,5 s  o clarão: o dragão irrompe da água, que sobe atrás numa coluna e respinga na saída
//  1,2 s  ele sobe, faz a curva pelo fundo da cena e volta serpenteando, ganhando corpo
//  3,6 s  vem de frente para a câmera em câmera lenta, quase para no ar e ruge: a cabeça ergue, o
//         corpo inteiro treme, faíscas explodem em volta e o halo acende atrás dele
//  5,0 s  dispara para o alto em espiral, acelerando, com o rastro de luz atrás
//  6,4 s  no alto do céu, ele se desfaz em borrifos de água, da cauda para a cabeça
// Fica montado (escondido) desde que as carpas aparecem: o modelo carrega e os shaders compilam
// antes, em segundo plano, e o salto não espera. Coordenadas do rio (o grupo cresce com a distância)
export const DRAGON = { duration: 8.2, rise: 0.5, dissolve: [6.4, 7.7], roar: [3.75, 4.75] };

const MODEL = '/models/dragon.glb';
// Comprimento do dragão na cena, o número de juntas da coluna e a altura do eixo do corpo no modelo
const LENGTH = 7.5;
const JOINTS = 40;
const AXIS_Y = 0.0105;
const TRAIL_PTS = 30;

// O trajeto da cabeça: [à direita da câmera, altura, na direção da câmera]. Começa bem abaixo da
// água (o corpo inteiro sai dela) e nunca fica exatamente na vertical (a coluna não gira). HERO é o
// ponto do plano principal: bem perto da câmera, de frente para ela, onde o rugido acontece
const PATH = [
  [-0.3, -11, -0.1], [-0.2, -4, -0.1], [0, 0, 0], [0.4, 2.2, -0.1], [2.1, 3.2, -0.3], [3.7, 3.1, -1.4],
  [2.6, 2.6, -2.5], [0.9, 2.3, -1.6], [0.1, 2, 1.8], [0, 1.75, 6.5], [-1.5, 3.1, 7], [-3.8, 5.4, 4],
  [-3.4, 7.6, 0], [0, 10, -1.6], [2, 14, 0],
];
const HERO = 9;
// O ritmo: [segundos, velocidade relativa]. Rápido na saída, freia até quase parar no rugido e
// dispara. Cada trecho é escalado para chegar a HERO no começo do rugido e ao fim do trajeto no fim
const PACE = [[0.5, 6], [1.2, 3.4], [2.6, 3], [3.3, 1.6], [3.75, 0.3], [4.75, 0.3], [5.3, 3], [6.2, 6], [8, 8]];
const paceAt = (t) => {
  if (t <= PACE[0][0]) return PACE[0][1];
  for (let i = 1; i < PACE.length; i += 1) {
    if (t <= PACE[i][0]) {
      const k = (t - PACE[i - 1][0]) / (PACE[i][0] - PACE[i - 1][0]);
      return PACE[i - 1][1] + (PACE[i][1] - PACE[i - 1][1]) * k * k * (3 - 2 * k);
    }
  }
  return PACE[PACE.length - 1][1];
};

// A coluna: a cada ponto do corpo (x: 0 focinho, 1 cauda), a posição e a orientação vêm das juntas
const dragonVertex = /* glsl */ `
  uniform vec3 uP[${JOINTS}];
  uniform vec4 uQ[${JOINTS}];
  uniform float uTime;
  uniform float uWind;
  attribute vec2 aUv;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vS;
  varying float vY;
  vec3 turn(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
  void main() {
    float s = position.x;
    float f = s * ${(JOINTS - 1).toFixed(1)};
    int i = int(min(floor(f), ${(JOINTS - 2).toFixed(1)}));
    float k = f - float(i);
    vec3 P = mix(uP[i], uP[i + 1], k);
    vec4 Q = normalize(mix(uQ[i], uQ[i + 1], k));
    // No modelo: x para a frente, y o dorso, z o lado. O que fica longe do eixo do corpo (juba,
    // fitas, nadadeiras, garras) balança com o vento; as patas remam, cada uma no seu tempo
    vec3 off = vec3(0.0, position.y, position.z);
    float far = smoothstep(0.32, 0.95, length(off.yz));
    off.x -= sin(uTime * 5.0 - s * 18.0 + position.z * 3.0) * far * 0.1 * uWind;
    off.y += sin(uTime * 3.7 + s * 22.0) * far * 0.05 * uWind;
    float leg = smoothstep(-0.3, -0.62, position.y) * (1.0 - smoothstep(0.62, 0.72, s));
    off.x += sin(uTime * 4.0 + sign(position.z) * 1.57 + s * 9.0) * leg * 0.22;
    vec3 local = P + turn(Q, off);
    vUv = aUv;
    vS = s;
    vY = local.y;
    vec4 world = modelMatrix * vec4(local, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * turn(Q, normal));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const dragonFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uDissolve;
  uniform float uHeat;
  uniform float uRoar;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vS;
  varying float vY;
  ${NOISE}
  void main() {
    // Abaixo da água ele não existe: sai dela de verdade
    if (vY < 0.0) discard;
    // Dissolução da cauda para a cabeça, com a borda acesa
    float cut = (1.0 - vS) * 0.85 + vnoise(vWorld.xy * 5.0 + vWorld.z * 3.0) * 0.25;
    float e = uDissolve * 1.15 - cut;
    if (e > 0.0) discard;
    float burn = smoothstep(-0.07, 0.0, e) * step(0.001, uDissolve);
    vec3 albedo = texture2D(uMap, vUv).rgb;
    vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 V = normalize(cameraPosition - vWorld);
    // A luz da noite: a lua fria por cima e o rebatido quente da água e das lanternas por baixo,
    // numa passagem curta (a textura já é pintada), mais o fio de contraluz que recorta a silhueta
    float ndl = dot(N, normalize(vec3(-0.35, 0.85, 0.4)));
    vec3 col = albedo * mix(vec3(0.5, 0.52, 0.72), vec3(1.05, 1.03, 1.0), smoothstep(-0.25, 0.3, ndl));
    col += albedo * vec3(0.3, 0.17, 0.06) * smoothstep(0.1, -0.8, N.y);
    float rim = smoothstep(0.55, 0.95, 1.0 - max(dot(N, V), 0.0));
    col += vec3(0.55, 0.72, 1.0) * rim * (0.32 + uRoar * 0.3);
    // Nasce luminoso, e o rugido corre pelo corpo em ouro, da cabeça para a cauda
    col = mix(col, vec3(1.8, 2.2, 2.3), uHeat * smoothstep(-0.2, 0.6, uHeat - vS * 0.6));
    col += albedo * vec3(1.0, 0.55, 0.2) * uRoar * 0.22 * smoothstep(0.75, 0.0, vS);
    col = mix(col, vec3(1.3, 1.9, 2.1), burn);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

// O rastro de luz: uma tira virada para a câmera. aRib: x ao longo (0 na raiz, 1 na ponta), y de
// um lado ao outro, z o tipo (3 rastro)
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
      // Crina: verde-água fundo na raiz, menta na ponta, em fios
      col = mix(vec3(0.02, 0.24, 0.2), vec3(0.14, 0.6, 0.46), smoothstep(0.0, 0.6, t));
      col = mix(col, vec3(0.5, 0.92, 0.72), smoothstep(0.65, 1.0, t));
      col *= 0.7 + 0.3 * sin(vRib.y * 34.0 + t * 5.0);
      a = smoothstep(0.0, 0.35, across) * (1.0 - smoothstep(0.55, 1.0, t));
    } else if (kind < 1.5) {
      col = mix(vec3(0.85, 0.86, 0.82), vec3(0.95, 1.0, 0.98), t);
      a = smoothstep(0.0, 0.55, across) * (1.0 - t * t);
    } else if (kind < 2.5) {
      col = mix(vec3(0.03, 0.3, 0.24), vec3(0.45, 0.92, 0.7), t);
      a = smoothstep(0.0, 0.4, across) * (1.0 - smoothstep(0.45, 1.0, t));
    } else {
      // Rastro de luz (somado): mais forte perto da cauda, some no fim
      col = vec3(0.6, 1.5, 1.4);
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

// Lê o modelo: a malha vira uma geometria com x = posição ao longo do corpo (0 no focinho, 1 na
// cauda) e y/z = a distância até o eixo do corpo, já na escala da cena. O arquivo guarda os valores
// quantizados: fromBufferAttribute devolve o valor real
async function loadDragon() {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js'),
  ]);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MODEL);
  gltf.scene.updateMatrixWorld(true);
  let mesh = null;
  gltf.scene.traverse((o) => { if (!mesh && o.isMesh) mesh = o; });
  const source = mesh.geometry;
  // A otimização tira as normais (o material original é sem luz): a iluminação daqui precisa delas
  if (!source.getAttribute('normal')) source.computeVertexNormals();
  const src = source.getAttribute('position');
  const srcN = source.getAttribute('normal');
  const srcUv = source.getAttribute('uv');
  const v = new Vector3();
  const pos = new Float32Array(src.count * 3);
  const nor = new Float32Array(src.count * 3);
  const uv = new Float32Array(src.count * 2);
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < src.count; i += 1) {
    v.fromBufferAttribute(src, i).applyMatrix4(mesh.matrixWorld);
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
  }
  const scale = LENGTH / (maxX - minX);
  for (let i = 0; i < src.count; i += 1) {
    v.fromBufferAttribute(src, i).applyMatrix4(mesh.matrixWorld);
    pos.set([(maxX - v.x) / (maxX - minX), (v.y - AXIS_Y) * scale, v.z * scale], i * 3);
    v.fromBufferAttribute(srcN, i).transformDirection(mesh.matrixWorld);
    nor.set([v.x, v.y, v.z], i * 3);
    uv.set([srcUv.getX(i), srcUv.getY(i)], i * 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new BufferAttribute(nor, 3));
  geometry.setAttribute('aUv', new BufferAttribute(uv, 2));
  geometry.setIndex(source.getIndex());
  return { geometry, map: mesh.material.map };
}

export default function KoiDragon({ run, onDone }) {
  const startRef = useRef(0);
  const groupRef = useRef(null);
  const koiRef = useRef(null);
  const meshRef = useRef(null);
  const ringRefs = useRef([]);
  const roared = useRef(false);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const [model, setModel] = useState(null);

  // O material existe antes do modelo chegar (a textura entra depois)
  const dragon = useMemo(() => {
    const uniforms = {
      uP: { value: Array.from({ length: JOINTS }, () => new Vector3()) },
      uQ: { value: Array.from({ length: JOINTS }, () => new Vector4(0, 0, 0, 1)) },
      uMap: { value: null },
      uTime: { value: 0 },
      uWind: { value: 1 },
      uDissolve: { value: 0 },
      uHeat: { value: 0 },
      uRoar: { value: 0 },
    };
    const material = new ShaderMaterial({ vertexShader: dragonVertex, fragmentShader: dragonFragment, side: DoubleSide, uniforms });
    return { uniforms, material };
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

  const trail = useMemo(() => ({
    geometry: ribbonGeometry([[TRAIL_PTS, 3]]),
    material: new ShaderMaterial({
      vertexShader: ribbonVertex, fragmentShader: ribbonFragment, transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, uniforms: { uFade: { value: 0 } },
    }),
  }), []);

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
    const sparks = makePoints(260, new Vector3(1.5, 1.1, 0.55), 9, 1, true);
    const embers = makePoints(220, new Vector3(0.75, 1.35, 1.45), 10, 1, true);
    const drops = makePoints(200, new Vector3(0.85, 0.94, 1), 7, 0, false);
    const mist = makePoints(36, new Vector3(0.78, 0.86, 1), 150, 1, false, 0.22);
    const halo = makePoints(1, new Vector3(1.0, 0.62, 0.28), 340, 1, true, 0.28);
    const flash = makePoints(1, new Vector3(1.15, 1.4, 1.45), 620, 1, true);
    return { koiMat, ringGeo, ringMats, sparks, embers, drops, mist, halo, flash };
  }, []);

  useEffect(() => () => {
    dragon.material.dispose();
    column.geometry.dispose();
    column.material.dispose();
    trail.geometry.dispose();
    trail.material.dispose();
    fx.koiMat.dispose();
    fx.ringGeo.dispose();
    fx.ringMats.forEach((m) => m.dispose());
    [fx.sparks, fx.embers, fx.drops, fx.mist, fx.halo, fx.flash].forEach((x) => { x.geometry.dispose(); x.material.dispose(); });
  }, [dragon, column, trail, fx]);

  // O modelo carrega quando o navegador sossega (~170 KB)
  useEffect(() => {
    let cancelled = false;
    let done = null;
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 800));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const id = idle(() => {
      loadDragon().then((m) => {
        if (cancelled) {
          m.geometry.dispose();
          m.map?.dispose();
          return;
        }
        done = m;
        dragon.uniforms.uMap.value = m.map;
        setModel(m);
      }).catch(() => {});
    }, { timeout: 3000 });
    return () => {
      cancelled = true;
      cancel(id);
      done?.geometry.dispose();
      done?.map?.dispose();
    };
  }, [dragon]);

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
  }, [gl, camera, scene, model]);

  const tmp = useMemo(() => ({
    p: Array.from({ length: JOINTS }, () => new Vector3()),
    t: Array.from({ length: JOINTS }, () => new Vector3()),
    n: Array.from({ length: JOINTS }, () => new Vector3()),
    b: Array.from({ length: JOINTS }, () => new Vector3()),
    pts: Array.from({ length: TRAIL_PTS }, () => new Vector3()),
    widths: new Float32Array(TRAIL_PTS),
    up: new Vector3(0, 1, 0),
    v: new Vector3(),
    w: new Vector3(),
    x: new Vector3(),
    cam: new Vector3(),
    tip: new Vector3(),
    m: new Matrix4(),
    q: new Quaternion(),
  }), []);

  // O trajeto (em relação à câmera, a cada salto) em pontos igualmente espaçados, e o relógio:
  // quanto do caminho a cabeça já andou em cada instante
  const route = useRef({ pts: [], step: 1, entry: 0, clock: new Float32Array(2), dtClock: 1 });

  // Cada salto: relógio zerado, trajeto montado, gotas do espirro e névoa na base
  useEffect(() => {
    const group = groupRef.current;
    if (!run || !group) {
      startRef.current = 0;
      if (group) group.visible = false;
      return;
    }
    startRef.current = performance.now() / 1000;
    roared.current = false;
    group.position.set(...run.at);
    group.visible = true;
    // Visto de longe (da Experiência o rio fica lá atrás), o dragão cresce para ter presença
    group.updateMatrixWorld();
    const world = group.getWorldPosition(new Vector3());
    group.scale.setScalar(Math.min(5, Math.max(1, world.distanceTo(camera.position) / 11)));
    group.updateMatrixWorld();

    // Os eixos do trajeto: para a câmera (no plano do chão) e a direita de quem olha
    const toCam = group.worldToLocal(camera.position.clone()).setY(0).normalize();
    const right = new Vector3().crossVectors(new Vector3(0, 1, 0), toCam);
    const place = ([r, y, f]) => new Vector3().addScaledVector(right, r).addScaledVector(toCam, f).setY(y);
    const curve = new CatmullRomCurve3(PATH.map(place), false, 'centripetal');
    curve.arcLengthDivisions = 600;
    const total = curve.getLength();
    const COUNT = 700;
    const pts = curve.getSpacedPoints(COUNT);
    const step = total / COUNT;
    // Onde a cabeça sai da água: o primeiro ponto do trajeto acima de y = 0
    const entry = pts.findIndex((p) => p.y >= 0) * step;
    // O relógio: o ritmo somado no tempo. Do salto ao rugido ele cobre o caminho até HERO; no rugido
    // a cabeça quase para; depois, cobre o resto do trajeto
    const heroAt = place(PATH[HERO]);
    let heroI = 0;
    pts.forEach((p, i) => { if (p.distanceToSquared(heroAt) < pts[heroI].distanceToSquared(heroAt)) heroI = i; });
    const heroS = heroI * step;
    const steps = 480;
    const dtClock = (DRAGON.duration - DRAGON.rise) / steps;
    const clock = new Float32Array(steps + 1);
    const spend = (from, to, startS, endS) => {
      const a = Math.round((from - DRAGON.rise) / dtClock);
      const b = Math.min(steps, Math.round((to - DRAGON.rise) / dtClock));
      let sum = 0;
      for (let i = a + 1; i <= b; i += 1) sum += paceAt(DRAGON.rise + i * dtClock);
      let spent = 0;
      clock[a] = startS;
      for (let i = a + 1; i <= b; i += 1) {
        spent += paceAt(DRAGON.rise + i * dtClock);
        clock[i] = startS + (endS - startS) * (spent / sum);
      }
    };
    const [roarIn, roarOut] = DRAGON.roar;
    spend(DRAGON.rise, roarIn, entry, heroS - 0.2);
    spend(roarIn, roarOut, heroS - 0.2, heroS + 0.2);
    spend(roarOut, DRAGON.duration, heroS + 0.2, total - 0.5);
    route.current = { pts, step, entry, clock, dtClock };

    fx.drops.list.forEach((d) => { d.life = 0; });
    fx.drops.list.slice(0, 80).forEach((d) => {
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
  // O ponto do trajeto a uma distância `s` do começo
  const pathAt = (s, out) => {
    const { pts, step } = route.current;
    const f = Math.max(0, s) / step;
    const i = Math.min(pts.length - 2, Math.floor(f));
    return out.lerpVectors(pts[i], pts[i + 1], Math.min(1, f - i));
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

    // O corpo desliza pelo trajeto: cada junta está atrás da cabeça, sempre à mesma distância
    const { clock, dtClock, entry } = route.current;
    const c = Math.max(0, (age - DRAGON.rise) / dtClock);
    const ci = Math.min(clock.length - 2, Math.floor(c));
    const headS = clock[ci] + (clock[ci + 1] - clock[ci]) * Math.min(1, c - ci);
    const [roarA, roarB] = DRAGON.roar;
    const roarK = Math.min(1, Math.max(0, (age - roarA) / (roarB - roarA)));
    const roar = roarK > 0 && roarK < 1 ? Math.sin(Math.PI * roarK) ** 0.6 : 0;
    for (let i = 0; i < JOINTS; i += 1) pathAt(headS - (i / (JOINTS - 1)) * LENGTH, tmp.p[i]);

    // Referenciais por transporte paralelo, puxados de leve para manter o dorso para cima
    const frames = () => {
      for (let i = 0; i < JOINTS; i += 1) {
        const a = tmp.p[Math.max(0, i - 1)];
        const b = tmp.p[Math.min(JOINTS - 1, i + 1)];
        tmp.t[i].subVectors(a, b);
        if (tmp.t[i].lengthSq() < 1e-10) tmp.t[i].set(0.01, 1, 0);
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
    // A ondulação: uma onda de lado e uma mais lenta de cima a baixo correm da cabeça para a cauda,
    // crescendo até a ponta. No rugido, a cabeça ergue e o corpo treme
    for (let i = 1; i < JOINTS; i += 1) {
      const k = i / (JOINTS - 1);
      const grow = Math.min(1, k * 3.2) * (0.7 + k * 0.7);
      tmp.p[i].addScaledVector(tmp.n[i], Math.sin(k * 11 - age * 4.2) * 0.22 * grow);
      tmp.p[i].addScaledVector(tmp.b[i], Math.sin(k * 7 - age * 2.9 + 1) * 0.12 * grow);
      if (roar) tmp.p[i].addScaledVector(tmp.n[i], Math.sin(age * 34 + k * 20) * 0.022 * roar);
    }
    if (roar) {
      for (let i = 0; i < JOINTS; i += 1) {
        const neck = Math.max(0, 1 - i / (JOINTS * 0.24));
        tmp.p[i].addScaledVector(tmp.up, neck * neck * roar * 0.5);
      }
    }
    frames();
    const u = dragon.uniforms;
    for (let i = 0; i < JOINTS; i += 1) {
      u.uP.value[i].copy(tmp.p[i]);
      tmp.w.crossVectors(tmp.t[i], tmp.b[i]);
      tmp.m.makeBasis(tmp.t[i], tmp.b[i], tmp.w);
      tmp.q.setFromRotationMatrix(tmp.m);
      // Sempre o caminho menor em relação à junta anterior: sem isso a mistura pode inverter
      const prev = u.uQ.value[Math.max(0, i - 1)];
      const flip = i > 0 && prev.x * tmp.q.x + prev.y * tmp.q.y + prev.z * tmp.q.z + prev.w * tmp.q.w < 0 ? -1 : 1;
      u.uQ.value[i].set(tmp.q.x * flip, tmp.q.y * flip, tmp.q.z * flip, tmp.q.w * flip);
    }
    u.uTime.value = age;
    u.uWind.value = 1 + roar * 1.2;
    u.uRoar.value = roar;
    const [d0, d1] = DRAGON.dissolve;
    const dissolve = Math.min(1, Math.max(0, (age - d0) / (d1 - d0)));
    u.uDissolve.value = dissolve;
    u.uHeat.value = Math.max(0, 1 - (age - DRAGON.rise) / 0.9);
    const born = Math.min(1, Math.max(0, (age - DRAGON.rise) / 0.2));
    trail.material.uniforms.uFade.value = born * (1 - dissolve);
    const alive = born > 0 && dissolve < 1;
    if (meshRef.current) meshRef.current.visible = alive;

    // Rastro de luz: o caminho que a cauda já percorreu
    const tailS = headS - LENGTH;
    for (let k = 0; k < TRAIL_PTS; k += 1) {
      pathAt(tailS + 0.3 - k * 0.2, tmp.pts[k]);
      tmp.widths[k] = 0.3 * (1 - k / TRAIL_PTS) * born * (tmp.pts[k].y > 0 ? 1 : 0);
    }
    writeRibbon(trail.geometry.attributes.position, 0, TRAIL_PTS);
    trail.geometry.attributes.position.needsUpdate = true;

    // A saída da água: enquanto o corpo atravessa a superfície, a água espirra em volta dele
    if (alive && tailS < entry) {
      for (let s = 0; s < 4; s += 1) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.5 + Math.random() * 1.4;
        tmp.tip.set(Math.cos(a) * 0.35, 0.02, Math.sin(a) * 0.35);
        tmp.v.set(Math.cos(a) * sp, 2 + Math.random() * 3, Math.sin(a) * sp);
        emit(fx.drops, tmp.tip, tmp.v);
      }
    }
    flushPoints(fx.drops, dt, 6.5, 0.6);
    flushPoints(fx.mist, dt, 0, 0.22, 0.6);

    // O rugido: uma explosão de faíscas em volta da cabeça e o halo acendendo atrás dele
    if (roarK > 0.08 && !roared.current) {
      roared.current = true;
      for (let s = 0; s < 150; s += 1) {
        tmp.v.set(Math.random() - 0.5, Math.random() - 0.35, Math.random() - 0.5).normalize().multiplyScalar(1.8 + Math.random() * 3.6);
        emit(fx.sparks, tmp.p[0], tmp.v, 0.7 + Math.random() * 0.3);
      }
    }
    fx.halo.list[0].p.copy(tmp.p[0]).addScaledVector(tmp.t[0], -0.6);
    fx.halo.list[0].life = roar;
    flushPoints(fx.halo, dt, 0, 0);

    // Gotas brilhantes soltas pelo corpo; na dissolução, o borrifo da borda
    if (alive && dissolve === 0) {
      for (let s = 0; s < 2; s += 1) {
        const i = Math.floor(Math.random() * JOINTS * 0.85);
        if (tmp.p[i].y > 0) {
          tmp.v.set((Math.random() - 0.5) * 0.8, 0.3 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8);
          emit(fx.sparks, tmp.p[i], tmp.v);
        }
      }
    }
    if (dissolve > 0 && dissolve < 1) {
      const edgeI = Math.round((1 - Math.min(1, dissolve * 1.15 / 0.85)) * (JOINTS - 1));
      for (let s = 0; s < 9; s += 1) {
        const i = Math.min(JOINTS - 1, Math.max(0, edgeI + Math.floor((Math.random() - 0.3) * 5)));
        tmp.v.set((Math.random() - 0.5) * 1.2, 0.6 + Math.random() * 1.1, (Math.random() - 0.5) * 1.2);
        tmp.tip.copy(tmp.p[i]).addScaledVector(tmp.n[i], (Math.random() - 0.5) * 0.5);
        emit(fx.embers, tmp.tip, tmp.v, 0.7 + Math.random() * 0.3);
      }
    }
    flushPoints(fx.sparks, dt, 0.8, 1.0, 0.5);
    // Borrifo: sobe com o impulso e cai de volta, como água
    flushPoints(fx.embers, dt, 1.6, 0.85, 0.8);
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={koiRef} geometry={koiGeometry()} material={fx.koiMat} renderOrder={4} frustumCulled={false} />
      {fx.ringMats.map((m, i) => (
        <mesh key={i} ref={(el) => { ringRefs.current[i] = el; }} geometry={fx.ringGeo} material={m} position={[0, 0.03, 0]} renderOrder={3} frustumCulled={false} />
      ))}
      <mesh geometry={column.geometry} material={column.material} renderOrder={3} frustumCulled={false} />
      {model ? <mesh ref={meshRef} geometry={model.geometry} material={dragon.material} frustumCulled={false} /> : null}
      <mesh geometry={trail.geometry} material={trail.material} renderOrder={5} frustumCulled={false} />
      <primitive object={fx.mist.points} />
      <primitive object={fx.drops.points} />
      <primitive object={fx.sparks.points} />
      <primitive object={fx.embers.points} />
      <primitive object={fx.halo.points} />
      <primitive object={fx.flash.points} />
    </group>
  );
}
