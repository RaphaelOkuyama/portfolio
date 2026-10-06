'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, ShaderMaterial } from 'three';
import { journeyStore, effectiveProgress } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { CELESTIAL } from './config';
import { smoothstep } from '../../lib/journey/math';
import { NOISE } from './glsl';
import { SUNSET, celestialAt, transitionPhase } from '../../lib/journey/skyTransition';

// Intensidade do disco, do halo e das manchas (mares da lua) por tema
const LOOK = { night: { disc: 1, halo: 0.42, maria: 1 }, day: { disc: 0.6, halo: 0.3, maria: 0 } };

// Tamanho do quad em raios do disco: sobra espaço para o halo se apagar
const EXTENT = 7;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uDisc;
  uniform float uHalo;
  uniform float uMaria;
  varying vec2 vUv;
  ${NOISE}

  void main() {
    vec2 p = (vUv - 0.5) * ${EXTENT.toFixed(1)};
    float d = length(p);
    float disc = smoothstep(1.0, 0.96, d);
    // Mares lunares: manchas suaves só dentro do disco
    float maria = smoothstep(0.45, 0.75, fbm(p * 1.6 + 3.0)) * uMaria * 0.16;
    // Halo em duas camadas: brilho curto em volta + véu largo
    float halo = (exp(-max(d - 1.0, 0.0) * 2.2) * 0.7 + exp(-d * 0.6) * 0.3) * uHalo;
    // Zera antes da borda do quad: sem retângulo visível no céu
    halo *= 1.0 - smoothstep(${(EXTENT / 2 - 1.2).toFixed(1)}, ${(EXTENT / 2).toFixed(1)}, d);
    float alpha = max(disc * uDisc, halo * (1.0 - disc));
    vec3 col = uColor * (1.0 - maria * disc);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

// Sol (昼) / lua (夜): disco com halo pintado, fora da névoa
export default function Celestial() {
  const target = useMemo(() => new Color(), []);
  const low = useMemo(() => new Color(SUNSET.sunLow), []);
  const meshRef = useRef(null);
  const initialized = useRef(false);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        fog: false,
        uniforms: {
          uColor: { value: new Color() },
          uDisc: { value: 0 },
          uHalo: { value: 0 },
          uMaria: { value: 0 },
        },
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const store = journeyStore.getState();
    // Some do hero em diante (e nas rotas congeladas, onde o progresso efetivo é 0.7)
    const visible = 1 - smoothstep(0.08, 0.18, effectiveProgress(store));
    const u = material.uniforms;
    const mesh = meshRef.current;

    // 日の入り: na troca de tema o astro antigo desce atrás das montanhas e o novo sobe. O sol
    // avermelha perto do horizonte, como o disco das gravuras
    const transit = celestialAt(transitionPhase(performance.now() / 1000));
    if (transit) {
      const look = LOOK[transit.theme];
      u.uColor.value.set(SCENE_ACCENTS[transit.theme].celestial);
      if (transit.theme === 'day') u.uColor.value.lerp(low, Math.min(1, transit.sink * 1.4));
      u.uDisc.value = look.disc * visible;
      u.uHalo.value = look.halo * visible * (1 + transit.sink * 0.8);
      u.uMaria.value = look.maria;
      if (mesh) mesh.position.y = CELESTIAL.position[1] - transit.sink * SUNSET.drop;
      state.invalidate();
      return;
    }
    if (mesh) mesh.position.y = CELESTIAL.position[1];

    const look = LOOK[store.theme];
    target.set(SCENE_ACCENTS[store.theme].celestial);
    const k = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    initialized.current = true;

    u.uColor.value.lerp(target, k);
    u.uDisc.value += (look.disc * visible - u.uDisc.value) * k;
    u.uHalo.value += (look.halo * visible - u.uHalo.value) * k;
    u.uMaria.value += (look.maria - u.uMaria.value) * k;

    if (Math.abs(u.uDisc.value - look.disc * visible) > 0.002) state.invalidate();
  });

  return (
    <mesh ref={meshRef} position={CELESTIAL.position} material={material}>
      <planeGeometry args={[CELESTIAL.radius * EXTENT, CELESTIAL.radius * EXTENT]} />
    </mesh>
  );
}
