'use client';
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { kasumiBands } from '../../lib/journey/landscape';
import { NOISE, noiseDefines } from './glsl';
import { KASUMI, MOUNTAIN_LAYERS } from './config';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSeed;
  uniform float uSpeed;
  uniform float uAspect;
  uniform float uTime;
  uniform vec2 uFadeNear;
  varying vec2 vUv;
  varying float vDepth;
  #include <fog_pars_fragment>
  ${NOISE}

  void main() {
    float x = vUv.x * uAspect;
    float drift = uTime * uSpeed;
    // Linha central ondulando e borda recortada: faixa de névoa das gravuras (Hiroshige)
    float center = 0.5 + (fbm(vec2(x * 0.08 + drift + uSeed, uSeed)) - 0.5) * 0.45;
    float d = abs(vUv.y - center) * 2.0;
    float edge = (fbm(vec2(x * 0.35 + drift * 1.6, vUv.y * 2.5 + uSeed)) - 0.5) * 0.55;
    float body = 1.0 - smoothstep(0.25, 0.9, d + edge);
    // Quebra a faixa em trechos ao longo do horizonte
    float segments = smoothstep(0.32, 0.62, fbm(vec2(x * 0.045 + drift * 0.5 + uSeed * 3.0, 1.0)));
    float sides = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    float near = smoothstep(uFadeNear.x, uFadeNear.y, vDepth);
    gl_FragColor = vec4(uColor, body * segments * sides * near * uOpacity);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

// Kasumi (霞): faixas de névoa entre as camadas de montanha, à deriva
export default function Kasumi() {
  const quality = useJourney((s) => s.quality);
  const bands = useMemo(
    () => kasumiBands(MOUNTAIN_LAYERS, { seed: 29, every: KASUMI.every[quality] ?? KASUMI.every.low }),
    [quality],
  );
  const geometry = useMemo(() => new PlaneGeometry(1, 1), []);
  const shared = useMemo(
    () => ({ color: { value: new Color() }, opacity: { value: 0 }, time: { value: 0 }, fadeNear: { value: KASUMI.fadeNear } }),
    [],
  );
  const materials = useMemo(
    () =>
      bands.map(
        (band) =>
          new ShaderMaterial({
            vertexShader,
            fragmentShader,
            defines: noiseDefines(quality),
            transparent: true,
            depthWrite: false,
            fog: true,
            uniforms: {
              ...UniformsUtils.merge([UniformsLib.fog, {
                uSeed: { value: band.seed },
                uSpeed: { value: band.speed },
                uAspect: { value: KASUMI.width / band.height },
              }]),
              // Cor, opacidade e tempo: os mesmos objetos em todas as faixas
              uColor: shared.color,
              uOpacity: shared.opacity,
              uTime: shared.time,
              uFadeNear: shared.fadeNear,
            },
          }),
      ),
    [bands, quality, shared],
  );

  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const white = useMemo(() => new Color('#ffffff'), []);
  const init = useMemo(() => ({ done: false }), []);

  useFrame((state, delta) => {
    const fog = state.scene.fog?.color;
    if (!fog) return;
    const { theme, lost } = journeyStore.getState();
    const k = init.done ? 1 - Math.exp(-delta * 4) : 1;
    init.done = true;
    shared.color.value.copy(fog).lerp(white, KASUMI.lighten[theme]);
    // No 迷子 a névoa densa já cobre tudo: as faixas somem nela
    const target = lost ? 0 : KASUMI.opacity[theme];
    shared.opacity.value += (target - shared.opacity.value) * k;
    shared.time.value = state.clock.elapsedTime;
  });

  return bands.map((band, i) => (
    <mesh
      key={`${quality}-${band.z}`}
      geometry={geometry}
      material={materials[i]}
      position={[0, band.y, band.z]}
      scale={[KASUMI.width, band.height, 1]}
    />
  ));
}
