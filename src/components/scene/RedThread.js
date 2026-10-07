'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, Vector3 } from 'three';
import { journeyStore } from '../../store/journey';
import { REDTHREAD } from './config';

// 組紐 / 赤い糸: homenagem a Kimi no Na wa. Quando a mensagem do contato vira lanterna, um fio
// vermelho trançado sai dela e sobe até o alto da montanha, ao fundo (o 奥山). Desenha-se da lanterna
// para cima, tremula ao vento, acompanha a lanterna descendo o rio e some aos poucos.
// Coordenadas do grupo do rio (as mesmas das lanternas)

const SEGMENTS = 96;

const vertexShader = /* glsl */ `
  attribute float aT;
  attribute float aSide;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform float uTime;
  uniform float uWidth;
  varying float vT;
  varying float vSide;

  vec3 bez(float t) {
    float u = 1.0 - t;
    return u * u * uA + 2.0 * u * t * uC + t * t * uB;
  }
  // O fio tremula: ondas que sobem por ele, paradas nas duas pontas
  vec3 thread(float t) {
    vec3 p = bez(t);
    float s = sin(3.14159 * t);
    p.x += sin(t * 9.0 - uTime * 2.0) * 0.35 * s;
    p.z += cos(t * 7.0 - uTime * 1.6) * 0.25 * s;
    return p;
  }

  void main() {
    vec3 p = thread(aT);
    vec3 tangent = thread(min(aT + 0.01, 1.0)) - thread(max(aT - 0.01, 0.0));
    vec4 world = modelMatrix * vec4(p, 1.0);
    // Fita sempre de frente para a câmera
    vec3 view = normalize(cameraPosition - world.xyz);
    vec3 side = normalize(cross(normalize(mat3(modelMatrix) * tangent), view));
    world.xyz += side * aSide * uWidth;
    vT = aT;
    vSide = aSide;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uProgress;
  uniform float uFade;
  varying float vT;
  varying float vSide;

  void main() {
    if (vT > uProgress) discard;
    float a = abs(vSide);
    // Fio fino e firme no meio, brilho largo em volta
    float core = 1.0 - smoothstep(0.12, 0.3, a);
    float glow = exp(-a * a * 4.0) * 0.45;
    // Trança do kumihimo: listras diagonais ao longo do fio
    float braid = 0.8 + 0.2 * sin(vT * 520.0 + vSide * 7.0);
    // A ponta que está subindo brilha mais (quase branca)
    float head = exp(-pow((uProgress - vT) * 40.0, 2.0)) * step(uProgress, 0.999);
    vec3 col = uColor * (core * braid * 1.4 + glow) + vec3(1.0, 0.85, 0.8) * head * core;
    float alpha = (core + glow + head) * uFade;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

export default function RedThread({ released }) {
  const geometry = useMemo(() => {
    const t = new Float32Array((SEGMENTS + 1) * 2);
    const side = new Float32Array((SEGMENTS + 1) * 2);
    const pos = new Float32Array((SEGMENTS + 1) * 2 * 3);
    for (let i = 0; i <= SEGMENTS; i += 1) {
      t[i * 2] = t[i * 2 + 1] = i / SEGMENTS;
      side[i * 2] = -1;
      side[i * 2 + 1] = 1;
    }
    const index = [];
    for (let i = 0; i < SEGMENTS; i += 1) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aT', new BufferAttribute(t, 1));
    g.setAttribute('aSide', new BufferAttribute(side, 1));
    g.setIndex(index);
    return g;
  }, []);
  const material = useMemo(() => new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uA: { value: new Vector3() },
      uB: { value: new Vector3(...REDTHREAD.to) },
      uC: { value: new Vector3() },
      uTime: { value: 0 },
      uWidth: { value: REDTHREAD.width },
      uColor: { value: new Color(REDTHREAD.color) },
      uProgress: { value: 0 },
      uFade: { value: 0 },
    },
  }), []);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  const meshRef = useRef(null);
  const run = useRef({ item: null, start: 0 });

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const now = performance.now() / 1000;
    const { reducedMotion } = journeyStore.getState();
    // Lanterna nova: começa um fio novo
    if (released.item && released.item !== run.current.item) run.current = { item: released.item, start: now };
    const { item, start } = run.current;
    const age = now - start;
    const { draw, hold, fade } = REDTHREAD;
    const alive = item && age < draw + hold + fade;
    mesh.visible = Boolean(alive);
    if (!alive) return;

    const u = material.uniforms;
    u.uProgress.value = reducedMotion ? 1 : Math.min(1, 1 - (1 - age / draw) ** 3);
    u.uFade.value = Math.min(1, age / 0.3, (draw + hold + fade - age) / fade);
    if (!reducedMotion) u.uTime.value += delta;
    // A ponta de baixo fica presa na lanterna (que desce o rio); a de cima no alto da montanha
    u.uA.value.set(item.x, REDTHREAD.lanternTop, item.z);
    u.uC.value.addVectors(u.uA.value, u.uB.value).multiplyScalar(0.5);
    u.uC.value.y += REDTHREAD.lift;
    // Fluido (60 fps) só enquanto o fio é desenhado; depois tremula bem a 30
    if (age < draw) state.invalidate();
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={3} visible={false} />;
}
