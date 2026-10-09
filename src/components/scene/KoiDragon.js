'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, ConeGeometry, CylinderGeometry, DoubleSide, MeshBasicMaterial, Points,
  ShaderMaterial, SphereGeometry, Vector3,
} from 'three';
import { NOISE } from './glsl';
import { assemble, paint, placed } from './lowpoly';

// 鯉の滝登り (登竜門): a carpa que vence a cachoeira vira dragão. A água sobe numa coluna (a
// cachoeira ao contrário), e de dentro dela sai o dragão dourado, um corpo longo que sobe em
// espiral até o céu soltando brilho, e some. Só existe enquanto acontece (~5 s); coordenadas do rio
export const DRAGON = { duration: 5.2, segments: 46, sides: 8, length: 0.034 };

const SEG = DRAGON.segments;
const SIDES = DRAGON.sides;

// A cabeça: sai da água subindo em espiral que abre, acelerando até o alto
function headAt(t, out) {
  const u = Math.max(0, t);
  const theta = u * 3.4;
  const radius = 0.9 + u * 0.55;
  // Sobe devagar enquanto dá a volta (fica no quadro) e acelera no fim, saindo pelo alto
  const y = -0.6 + 1.25 * u ** 1.2 + Math.max(0, u - 3.2) ** 2 * 2.4;
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
    // Escamas em meia-lua sobrepostas (como as de carpa), com a borda de cada uma mais escura
    vec2 g = vec2(vUv.x * 60.0, vUv.y * 10.0 + floor(vUv.x * 60.0) * 0.5);
    vec2 cell = fract(g) - vec2(0.5, 0.0);
    float rim = smoothstep(0.42, 0.5, length(cell * vec2(1.0, 0.9)));
    vec3 gold = mix(vec3(1.0, 0.8, 0.34), vec3(0.78, 0.48, 0.12), rim * 0.7);
    // Barriga mais clara e a crina vermelha no dorso
    float belly = smoothstep(0.35, 0.0, abs(vUv.y - 0.5));
    gold = mix(gold, vec3(1.0, 0.93, 0.7), belly * 0.5);
    float mane = smoothstep(0.12, 0.0, min(vUv.y, 1.0 - vUv.y)) * smoothstep(0.98, 0.1, vUv.x);
    gold = mix(gold, vec3(0.85, 0.12, 0.08), mane * 0.8);
    // Brilho de borda (fresnel) e um reflexo que corre pelo corpo
    float edge = pow(1.0 - max(dot(normalize(vNormalW), vView), 0.0), 2.2);
    float sheen = pow(vnoise(vec2(vUv.x * 6.0 - uTime * 2.0, vUv.y * 3.0)), 3.0);
    vec3 col = gold * (0.8 + sheen * 0.5) + vec3(1.0, 0.85, 0.5) * edge * 0.9;
    // A cauda some em brilho
    float tail = smoothstep(1.0, 0.82, vUv.x);
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
    float alpha = (0.35 + streak * 0.55) * top * uFade * smoothstep(0.0, 0.08, vUv.y);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const sparkVertex = /* glsl */ `
  attribute float aLife;
  varying float vLife;
  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (6.0 + aLife * 10.0) * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const sparkFragment = /* glsl */ `
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5 || vLife < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0, 0.82, 0.45) * (1.2 - d * 2.0), (1.0 - d * 2.0) * vLife);
  }
`;

// Cabeça do dragão, low-poly como o resto da cena (frente em +z): crânio, focinho com o maxilar, os
// chifres de cervo para trás, olhos vermelhos, a crina em chamas e os bigodes longos
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
    const g = paint(new SphereGeometry(r, 9, 7), color);
    g.scale(...scale);
    return placed(g, at);
  };
  const parts = [
    ball(0.4, [1, 0.82, 1.15], GOLD, {}),
    cyl(0.2, 0.3, 0.7, LIGHT, { z: 0.5, y: -0.04, rotX: Math.PI / 2 }),
    cyl(0.14, 0.22, 0.55, GOLD, { z: 0.42, y: -0.2, rotX: Math.PI / 2 + 0.18 }),
    ball(0.075, [1, 1, 1], RED, { x: 0.2, y: 0.14, z: 0.32 }),
    ball(0.075, [1, 1, 1], RED, { x: -0.2, y: 0.14, z: 0.32 }),
  ];
  for (const sx of [-1, 1]) {
    // Chifre: haste para trás e para cima, com uma ponta lateral
    parts.push(cyl(0.025, 0.05, 0.75, HORN, { x: sx * 0.16, y: 0.42, z: -0.32, rotX: -0.9, rotZ: -sx * 0.25 }));
    parts.push(cone(0.03, 0.26, HORN, { x: sx * 0.26, y: 0.56, z: -0.36, rotX: -0.4, rotZ: -sx * 0.9 }));
    // Bigodes: fios longos saindo do focinho para trás
    parts.push(cyl(0.012, 0.022, 1.1, LIGHT, { x: sx * 0.42, y: -0.06, z: 0.42, rotX: Math.PI / 2, rotY: sx * 0.9 }));
  }
  // Crina: chamas vermelhas atrás do crânio
  [[0, 0.32, -0.42, 0.13], [0.18, 0.2, -0.46, 0.1], [-0.18, 0.2, -0.46, 0.1], [0, 0.08, -0.5, 0.11]].forEach(([x, y, z, r]) => {
    parts.push(cone(r, 0.5, RED, { x, y, z, rotX: -1.9 }));
  });
  headCache = assemble(parts);
  return headCache;
}

export default function KoiDragon({ at, onDone }) {
  const startRef = useRef(performance.now() / 1000);
  const groupRef = useRef(null);
  const sized = useRef(false);

  const body = useMemo(() => {
    const ringCount = SEG;
    const vertCount = ringCount * SIDES;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertCount * 3), 3));
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(vertCount * 3), 3));
    const uv = new Float32Array(vertCount * 2);
    for (let i = 0; i < ringCount; i += 1) {
      for (let j = 0; j < SIDES; j += 1) {
        uv[(i * SIDES + j) * 2] = i / (ringCount - 1);
        uv[(i * SIDES + j) * 2 + 1] = j / SIDES;
      }
    }
    geometry.setAttribute('aUv', new BufferAttribute(uv, 2));
    const index = [];
    for (let i = 0; i < ringCount - 1; i += 1) {
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
      uniforms: { uFade: { value: 1 }, uTime: { value: 0 } },
    });
    return { geometry, material };
  }, []);

  const column = useMemo(() => {
    const geometry = new CylinderGeometry(0.75, 1.1, 9, 24, 1, true);
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

  const head = useMemo(() => ({ material: new MeshBasicMaterial({ vertexColors: true, transparent: true }) }), []);
  const headRef = useRef(null);

  const sparks = useMemo(() => {
    const n = 90;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    geometry.setAttribute('aLife', new BufferAttribute(new Float32Array(n), 1));
    const material = new ShaderMaterial({
      vertexShader: sparkVertex, fragmentShader: sparkFragment, transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    const list = Array.from({ length: n }, () => ({ p: new Vector3(), v: new Vector3(), life: 0 }));
    return { geometry, material, points, list, next: 0 };
  }, []);

  useEffect(() => () => {
    [body, column, sparks].forEach((x) => { x.geometry.dispose(); x.material.dispose(); });
    head.material.dispose();
  }, [body, column, sparks, head]);

  const tmp = useMemo(() => ({
    p: Array.from({ length: SEG }, () => new Vector3()),
    t: new Vector3(), n: new Vector3(), b: new Vector3(), up: new Vector3(0, 1, 0), fwd: new Vector3(0, 0, 1),
  }), []);

  useFrame((state, delta) => {
    const age = performance.now() / 1000 - startRef.current;
    if (age > DRAGON.duration) {
      onDone();
      return;
    }
    state.invalidate();
    // Visto de longe (da Experiência o rio fica lá atrás), o dragão cresce para ter presença
    if (!sized.current && groupRef.current) {
      sized.current = true;
      const world = groupRef.current.getWorldPosition(new Vector3());
      groupRef.current.scale.setScalar(Math.min(5, Math.max(1, world.distanceTo(state.camera.position) / 11)));
    }
    // A coluna: sobe rápido, segura enquanto o dragão sai, e desaba
    const rise = Math.min(1, age / 0.55) * (1 - Math.max(0, (age - 2.2) / 0.9));
    column.material.uniforms.uTime.value = age;
    column.material.uniforms.uRise.value = Math.max(0, rise);
    column.material.uniforms.uFade.value = Math.max(0, 1 - Math.max(0, age - 2.6) / 0.6);

    // O corpo: cada anel é a cabeça um pouco antes no tempo (o corpo segue o caminho dela)
    const t0 = age - 0.45;
    for (let i = 0; i < SEG; i += 1) headAt(t0 - i * DRAGON.length * (1 + i * 0.012), tmp.p[i]);
    const pos = body.geometry.attributes.position;
    const nor = body.geometry.attributes.normal;
    for (let i = 0; i < SEG; i += 1) {
      const a = tmp.p[Math.max(0, i - 1)];
      const b = tmp.p[Math.min(SEG - 1, i + 1)];
      tmp.t.subVectors(a, b).normalize();
      tmp.n.crossVectors(tmp.t, tmp.up).normalize();
      if (tmp.n.lengthSq() < 0.01) tmp.n.set(1, 0, 0);
      tmp.b.crossVectors(tmp.n, tmp.t).normalize();
      // Grosso logo atrás da cabeça, afinando até a cauda, com uma ondulação
      const k = i / (SEG - 1);
      const profile = k < 0.12 ? 0.62 + 0.38 * (k / 0.12) : (1 - (k - 0.12) / 0.88) ** 0.85;
      const radius = (0.32 * profile + 0.012) * (1 + Math.sin(k * 22 - age * 10) * 0.05);
      for (let j = 0; j < SIDES; j += 1) {
        const ang = (j / SIDES) * Math.PI * 2;
        const cx = Math.cos(ang);
        const cy = Math.sin(ang);
        const nx = tmp.n.x * cx + tmp.b.x * cy;
        const ny = tmp.n.y * cx + tmp.b.y * cy;
        const nz = tmp.n.z * cx + tmp.b.z * cy;
        const idx = i * SIDES + j;
        pos.setXYZ(idx, tmp.p[i].x + nx * radius, tmp.p[i].y + ny * radius, tmp.p[i].z + nz * radius);
        nor.setXYZ(idx, nx, ny, nz);
      }
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    body.geometry.computeBoundingSphere();
    body.material.uniforms.uTime.value = age;
    const fade = Math.min(1, Math.max(0, (age - 0.4) / 0.3)) * (1 - Math.max(0, (age - 4.2) / 1.0));
    body.material.uniforms.uFade.value = fade;
    // A cabeça na ponta do corpo, olhando para onde ele vai
    if (headRef.current) {
      tmp.t.subVectors(tmp.p[0], tmp.p[1]);
      if (tmp.t.lengthSq() > 1e-6) headRef.current.quaternion.setFromUnitVectors(tmp.fwd, tmp.t.normalize());
      headRef.current.position.copy(tmp.p[0]);
      head.material.opacity = fade;
    }

    // Brilho: faíscas soltas pelo corpo, que flutuam e apagam
    const dt = Math.min(delta, 1 / 20);
    for (let s = 0; s < 3; s += 1) {
      const spark = sparks.list[sparks.next];
      sparks.next = (sparks.next + 1) % sparks.list.length;
      spark.p.copy(tmp.p[Math.floor(Math.random() * SEG * 0.8)]);
      spark.v.set((Math.random() - 0.5) * 0.8, 0.3 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8);
      spark.life = age < 4.4 ? 1 : 0;
    }
    const sp = sparks.geometry.attributes.position;
    const life = sparks.geometry.attributes.aLife;
    sparks.list.forEach((spark, i) => {
      spark.life = Math.max(0, spark.life - dt * 1.1);
      spark.p.addScaledVector(spark.v, dt);
      sp.setXYZ(i, spark.p.x, spark.p.y, spark.p.z);
      life.setX(i, spark.life);
    });
    sp.needsUpdate = true;
    life.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={at}>
      <mesh geometry={column.geometry} material={column.material} renderOrder={3} frustumCulled={false} />
      <mesh geometry={body.geometry} material={body.material} renderOrder={4} frustumCulled={false} />
      <mesh ref={headRef} geometry={dragonHead()} material={head.material} renderOrder={5} frustumCulled={false} scale={0.95} />
      <primitive object={sparks.points} />
    </group>
  );
}
