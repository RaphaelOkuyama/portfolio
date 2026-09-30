'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils, Vector3 } from 'three';
import { journeyStore, effectiveProgress, useJourney } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { smoothstep } from '../../lib/journey/math';
import { getCameraCurve } from './useCameraMap';
import { NOISE, noiseDefines } from './glsl';
import Lanterns from './Lanterns';
import { LANTERNS, RIVER } from './config';

// Máximo de reflexos: lanternas fixas + soltas pelo formulário
export const MAX_REFLECTIONS = LANTERNS.count.high + LANTERNS.maxReleased;

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vLocal;
  varying float vDepth;
  void main() {
    vLocal = position.xy;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

// Coordenadas locais do plano: x lateral, y ao longo do rio (y maior = mais longe da câmera)
const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uWater;
  uniform vec3 uSky;
  uniform vec3 uGlow;
  uniform float uSkyReflection;
  uniform float uReflection;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uLanterns[${MAX_REFLECTIONS}]; // x, y no plano, intensidade
  uniform int uCount;
  varying vec2 vLocal;
  varying float vDepth;
  ${NOISE}

  void main() {
    float t = uTime;
    // Ondulação: marolas alongadas na horizontal, descendo o rio
    float ripple = fbm(vec2(vLocal.x * 0.5, vLocal.y * 2.2 - t * 0.5));
    float fine = fbm(vec2(vLocal.x * 1.6 + 7.0, vLocal.y * 6.0 - t * 1.1));

    // Reflexo do céu cresce com a distância (ângulo rasante), quebrado pelas marolas
    float grazing = smoothstep(4.0, 45.0, vDepth);
    vec3 col = mix(uWater, uSky, grazing * uSkyReflection * (0.75 + 0.5 * ripple));
    // Linhas de brilho das marolas, como nas gravuras de água
    float lines = smoothstep(0.64, 0.72, fbm(vec2(vLocal.x * 0.22, vLocal.y * 3.2 - t * 0.6)));
    col = mix(col, uSky, lines * 0.18 * (1.0 - grazing * 0.5));

    // Lanternas: poça de luz em volta + rastro vertical tremido na direção da câmera
    vec3 light = vec3(0.0);
    for (int i = 0; i < ${MAX_REFLECTIONS}; i++) {
      if (i >= uCount) break;
      vec3 l = uLanterns[i];
      float dy = l.y - vLocal.y;
      float wobble = sin(vLocal.y * 5.0 + t * 2.2 + l.x) * 0.12 + (fine - 0.5) * 0.35;
      float dx = vLocal.x - l.x + wobble * clamp(dy, 0.0, 3.0);
      float streak = exp(-dx * dx / 0.05) * exp(-max(dy, 0.0) * 0.55) * step(-0.25, dy);
      float pool = exp(-(dx * dx + dy * dy) / 0.5);
      light += uGlow * l.z * (streak * (0.45 + 0.9 * fine) + pool * 0.35);
    }
    col += light * uReflection;

    // Margens irregulares que se fundem com o chão
    float halfW = ${(RIVER.size[0] / 2).toFixed(1)};
    float bank = smoothstep(0.0, 2.5 + fbm(vec2(vLocal.y * 0.15, 3.0)) * 3.0, halfW - abs(vLocal.x));
    gl_FragColor = vec4(col, uOpacity * bank);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

// Rio ao fim da jornada, onde as lanternas do contato descem até sumirem na névoa
export default function River() {
  const start = useJourney((s) => s.sectionRanges.contato?.[0]) ?? RIVER.fallbackStart;
  const quality = useJourney((s) => s.quality);
  const scene = useThree((s) => s.scene);
  const groupRef = useRef(null);

  // Centro do rio: adiante e abaixo do fim do caminho da câmera
  const center = useMemo(() => {
    const end = getCameraCurve().getPointAt(1);
    return [end.x, end.y - RIVER.drop, end.z + RIVER.offsetZ];
  }, []);

  const geometry = useMemo(() => new PlaneGeometry(RIVER.size[0], RIVER.size[1], 1, 1), []);
  const reflections = useMemo(
    () => ({
      lanterns: { value: Array.from({ length: MAX_REFLECTIONS }, () => new Vector3()) },
      count: { value: 0 },
    }),
    [],
  );
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        defines: noiseDefines(quality),
        transparent: true,
        depthWrite: false,
        fog: true,
        uniforms: {
          ...UniformsUtils.merge([
            UniformsLib.fog,
            {
              uWater: { value: new Color() },
              uSky: { value: new Color() },
              uGlow: { value: new Color() },
              uSkyReflection: { value: 0 },
              uReflection: { value: 0 },
              uTime: { value: 0 },
              uOpacity: { value: 0 },
            },
          ]),
          // Compartilhados com as lanternas, que escrevem as posições a cada frame
          uLanterns: reflections.lanterns,
          uCount: reflections.count,
        },
      }),
    [quality, reflections],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const target = useMemo(() => new Color(), []);
  const init = useRef(false);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const journey = journeyStore.getState();
    const opacity = smoothstep(start - 0.06, start + 0.01, effectiveProgress(journey));
    group.visible = opacity > 0.001;
    if (!group.visible) return;
    const { theme } = journey;
    const u = material.uniforms;
    const k = init.current ? 1 - Math.exp(-delta * 4) : 1;
    init.current = true;
    target.set(SCENE_ACCENTS[theme].water);
    u.uWater.value.lerp(target, k);
    if (scene.fog) u.uSky.value.copy(scene.fog.color);
    target.set(SCENE_ACCENTS[theme].lantern);
    u.uGlow.value.lerp(target, k);
    u.uSkyReflection.value += (RIVER.skyReflection[theme] - u.uSkyReflection.value) * k;
    u.uReflection.value += (LANTERNS.reflection[theme] - u.uReflection.value) * k;
    u.uOpacity.value = opacity;
    if (!journey.reducedMotion) u.uTime.value += delta;
  });

  return (
    <group ref={groupRef} position={center}>
      <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />
      <Lanterns reflections={reflections} />
    </group>
  );
}
