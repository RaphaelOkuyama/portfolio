'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color, DoubleSide, ShaderMaterial, Vector3 } from 'three';
import { journeyStore } from '../../store/journey';
import { flockFormation, flockX } from '../../lib/journey/landscape';
import { SCENE_ACCENTS } from '../../lib/palette';
import { BIRDS } from './config';

// Um pássaro = duas asas (triângulos) saindo do corpo; aTip marca a ponta que bate
const WING = [
  // asa esquerda: corpo, ponta, dobra
  [0, 0, 0, 0], [-1, 0.1, 0, 1], [-0.35, -0.12, 0, 0.4],
  // asa direita
  [0, 0, 0, 0], [0.35, -0.12, 0, 0.4], [1, 0.1, 0, 1],
];

function flockGeometry(birds) {
  const position = new Float32Array(birds.length * WING.length * 3);
  const tip = new Float32Array(birds.length * WING.length);
  const bird = new Float32Array(birds.length * WING.length * 4);
  birds.forEach((b, i) => {
    WING.forEach(([x, y, z, t], v) => {
      const k = i * WING.length + v;
      position.set([x, y, z], k * 3);
      tip[k] = t;
      bird.set(b, k * 4);
    });
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aTip', new BufferAttribute(tip, 1));
  geometry.setAttribute('aBird', new BufferAttribute(bird, 4));
  return geometry;
}

const vertexShader = /* glsl */ `
  attribute float aTip;
  attribute vec4 aBird; // deslocamento na formação + fase da batida
  uniform vec3 uFlock;
  uniform float uScale;
  uniform float uTime;
  void main() {
    vec3 local = position;
    // Batida de asa: as pontas sobem e descem, a dobra acompanha menos
    local.y += aTip * sin(uTime * 7.0 + aBird.w) * 0.55;
    vec3 world = uFlock + aBird.xyz + local * uScale;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
    #include <colorspace_fragment>
  }
`;

// Bando cruzando o céu de tempos em tempos, sempre à frente da câmera
export default function Birds() {
  const geometry = useMemo(() => flockGeometry(flockFormation(BIRDS.count, { seed: 11 })), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        fog: false,
        uniforms: {
          uFlock: { value: new Vector3() },
          uScale: { value: BIRDS.scale },
          uTime: { value: 0 },
          uColor: { value: new Color() },
          uOpacity: { value: 0 },
        },
      }),
    [],
  );
  const meshRef = useRef(null);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { theme, reducedMotion, lost } = journeyStore.getState();
    const time = state.clock.elapsedTime;
    const x = reducedMotion || lost ? null : flockX(time, BIRDS);
    mesh.visible = x !== null;
    if (x === null) return;

    const u = material.uniforms;
    const cam = state.camera.position;
    // Sobe um pouco ao cruzar (planeio em arco) e fica sempre alguns metros acima da câmera
    u.uFlock.value.set(cam.x + x, cam.y + BIRDS.height + Math.sin((x / BIRDS.span) * Math.PI * 0.5) * 2, cam.z - BIRDS.ahead);
    u.uTime.value = time;
    u.uColor.value.set(SCENE_ACCENTS[theme].toriiTop);
    u.uOpacity.value = BIRDS.opacity[theme];
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} visible={false} />;
}
