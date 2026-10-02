'use client';
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color, Plane, PlaneGeometry, Raycaster, ShaderMaterial, UniformsLib, UniformsUtils, Vector2, Vector3,
} from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { SEASONS, SCENE_ACCENTS, THEMES } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { groundHeight } from '../../lib/journey/ground';
import { pointer } from '../../lib/pointer';
import { NOISE, noiseDefines } from './glsl';
import { GARDEN, GROUND, MOUNTAIN_LOOK } from './config';
import { useGardenPlacement } from './gardenPlacement';

const STONES = GARDEN.stones.length;
// Distância em que o chão atinge o tom "longe" (a mesma das camadas de montanha)
const FAR_DISTANCE = 60;

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uNear;
  uniform vec3 uMid;
  uniform vec3 uFar;
  uniform vec3 uCamera;
  uniform vec3 uMist;
  uniform float uMistStrength;
  uniform vec3 uSand;
  uniform vec3 uCurb;
  uniform vec3 uAccent;
  uniform vec2 uGarden;      // centro (x, z) da areia
  uniform vec2 uGardenHalf;  // meia largura e meia profundidade
  uniform float uBorder;
  uniform vec3 uStones[${STONES}]; // x, z locais ao jardim, raio
  uniform float uActive;
  uniform float uGlow;
  uniform vec3 uPointer;
  uniform float uPointerActive;
  varying vec3 vWorld;
  ${NOISE}

  void main() {
    // Terra do vale: mesmo tom das montanhas para a distância, com grão de pincel
    float t = clamp(distance(vWorld.xz, uCamera.xz) / ${FAR_DISTANCE.toFixed(1)}, 0.0, 1.0);
    vec3 ground = t < 0.5 ? mix(uNear, uMid, t * 2.0) : mix(uMid, uFar, (t - 0.5) * 2.0);
    float grain = fbm(vWorld.xz * vec2(0.35, 0.9));
    ground *= 0.92 + 0.14 * grain;
    // Névoa rasteira, como no pé das montanhas
    ground = mix(ground, uMist, uMistStrength * (0.55 + 0.25 * fbm(vWorld.xz * 0.05)));

    // Jardim (枯山水): retângulo de areia rastelada com moldura de pedra
    vec2 local = vWorld.xz - uGarden;
    vec2 q = abs(local) - uGardenHalf;
    float outside = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); // distância à borda (< 0 dentro)
    float sandMask = 1.0 - smoothstep(-0.04, 0.04, outside);
    float curbMask = (1.0 - smoothstep(uBorder - 0.04, uBorder + 0.04, outside)) * (1.0 - sandMask);

    float rake = sin(local.y * 11.0);
    float glow = 0.0;
    for (int i = 0; i < ${STONES}; i++) {
      vec3 s = uStones[i];
      float d = distance(local, s.xy);
      float ring = smoothstep(s.z + 1.6, s.z + 1.2, d);
      float wave = sin((d - s.z) * 11.0);
      rake = mix(rake, wave, ring);
      // Anéis da pedra escolhida (a mesma do painel do Stack) ganham a cor de acento
      float chosen = 1.0 - step(0.5, abs(float(i) - uActive));
      glow = max(glow, chosen * ring * smoothstep(0.2, 1.0, wave));
    }
    // O cursor afunda a areia: sombra suave onde ele passa
    float dent = uPointerActive * exp(-dot(vWorld.xz - uPointer.xz, vWorld.xz - uPointer.xz) / 1.6);
    // Cascalho: sulcos do ancinho bem marcados + grão fino que dá textura de areia
    float speck = fbm(vWorld.xz * 9.0);
    vec3 sand = uSand * (0.84 + 0.14 * rake + 0.1 * (speck - 0.5) - dent * 0.14);
    sand = mix(sand, uAccent, glow * uGlow);
    // Só um véu de névoa: a areia clara precisa continuar legível
    sand = mix(sand, uMist, uMistStrength * 0.15);

    vec3 col = mix(ground, uCurb * (0.9 + 0.12 * grain), curbMask);
    col = mix(col, sand, sandMask);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

// Malha do chão: plano subdividido com a altura de groundHeight em cada vértice
function buildGeometry() {
  const [width, depth] = GROUND.size;
  const [segX, segZ] = GROUND.segments;
  const geometry = new PlaneGeometry(width, depth, segX, segZ);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + GROUND.center[0];
    const z = pos.getZ(i) + GROUND.center[1];
    pos.setXYZ(i, x, groundHeight(x, z, GROUND), z);
  }
  geometry.computeBoundingSphere();
  return geometry;
}

// 地: chão do vale, com o jardim zen do Stack pintado nele
export default function Ground() {
  const quality = useJourney((s) => s.quality);
  const { center } = useGardenPlacement();
  const geometry = useMemo(() => buildGeometry(), []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        defines: noiseDefines(quality),
        fog: true,
        uniforms: UniformsUtils.merge([
          UniformsLib.fog,
          {
            uNear: { value: new Color() },
            uMid: { value: new Color() },
            uFar: { value: new Color() },
            uCamera: { value: new Vector3() },
            uMist: { value: new Color() },
            uMistStrength: { value: 0 },
            uSand: { value: new Color() },
            uCurb: { value: new Color() },
            uAccent: { value: new Color() },
            uGarden: { value: new Vector2() },
            uGardenHalf: { value: new Vector2(GARDEN.size[0] / 2, GARDEN.size[1] / 2) },
            uBorder: { value: GARDEN.border },
            uStones: { value: GARDEN.stones.map((s) => new Vector3(s.x, s.z, s.r)) },
            uActive: { value: -1 },
            uGlow: { value: 0 },
            uPointer: { value: new Vector3() },
            uPointerActive: { value: 0 },
          },
        ]),
      }),
    [quality],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    material.uniforms.uGarden.value.set(center[0], center[2]);
  }, [material, center]);

  const scratch = useMemo(
    () => ({
      target: new Color(),
      raycaster: new Raycaster(),
      ndc: new Vector2(),
      plane: new Plane(new Vector3(0, 1, 0), 0),
      hit: new Vector3(),
      state: { initialized: false, mist: 0 },
    }),
    [],
  );

  useFrame((frame, delta) => {
    const { theme, seasonMix, activeStone, reducedMotion } = journeyStore.getState();
    const u = material.uniforms;
    const st = scratch.state;
    const k = st.initialized ? 1 - Math.exp(-delta * 6) : 1;
    st.initialized = true;
    let pending = false;

    const [near, mid, far] = sampleSeason(SEASONS[theme], seasonMix).mountains;
    for (const [uniform, hex] of [[u.uNear, near], [u.uMid, mid], [u.uFar, far], [u.uSand, SCENE_ACCENTS[theme].sand], [u.uCurb, SCENE_ACCENTS[theme].stone]]) {
      scratch.target.set(hex);
      uniform.value.lerp(scratch.target, k);
      const c = uniform.value;
      if (Math.abs(c.r - scratch.target.r) + Math.abs(c.g - scratch.target.g) + Math.abs(c.b - scratch.target.b) > 0.002) pending = true;
    }
    u.uAccent.value.set(THEMES[theme].accent);
    if (frame.scene.fog) u.uMist.value.copy(frame.scene.fog.color);
    st.mist += (MOUNTAIN_LOOK[theme].mist - st.mist) * k;
    u.uMistStrength.value = st.mist;
    u.uCamera.value.copy(frame.camera.position);

    // Troca de pedra: o brilho apaga e reacende em volta da nova
    const glowTarget = activeStone === null ? 0 : GARDEN.activeRingGlow;
    if (Math.round(u.uActive.value) !== (activeStone ?? -1)) {
      u.uGlow.value = 0;
      u.uActive.value = activeStone ?? -1;
    }
    u.uGlow.value += (glowTarget - u.uGlow.value) * k;
    if (Math.abs(glowTarget - u.uGlow.value) > 0.002) pending = true;

    // Cursor → ponto no chão do jardim
    const active = pointer.active && !reducedMotion;
    u.uPointerActive.value = active ? 1 : 0;
    if (active) {
      scratch.plane.constant = -center[1];
      scratch.ndc.set(pointer.x, pointer.y);
      scratch.raycaster.setFromCamera(scratch.ndc, frame.camera);
      if (scratch.raycaster.ray.intersectPlane(scratch.plane, scratch.hit)) u.uPointer.value.copy(scratch.hit);
    }

    if (pending) frame.invalidate();
  });

  return <mesh geometry={geometry} material={material} />;
}
