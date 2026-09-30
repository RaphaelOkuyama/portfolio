'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color, DodecahedronGeometry, MeshBasicMaterial, Plane, PlaneGeometry, Raycaster,
  ShaderMaterial, UniformsLib, UniformsUtils, Vector2, Vector3,
} from 'three';
import { journeyStore, effectiveProgress, useJourney } from '../../store/journey';
import { SCENE_ACCENTS, THEMES } from '../../lib/palette';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { bandOpacity } from '../../lib/journey/math';
import { pointer } from '../../lib/pointer';
import { createCameraCurve } from './cameraCurve';
import { GARDEN } from './config';
import Fireflies from './Fireflies';

const MAX_STONES = 9;

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  uniform vec3 uPointer;
  uniform float uPointerActive;
  uniform float uDisplace;
  varying vec2 vLocal;
  varying float vDent;

  void main() {
    vec3 p = position;
    // Plano no XY rotacionado para o chão: local.xy = (x, -z) do jardim
    vLocal = vec2(p.x, -p.y);
    vec4 world = modelMatrix * vec4(p, 1.0);

    // A areia afunda sob o cursor (só em qualidade alta)
    float d = distance(world.xz, uPointer.xz);
    float dent = uDisplace * uPointerActive * exp(-d * d / 1.6);
    vDent = dent;
    p.z -= dent * 0.35;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uSand;
  uniform float uOpacity;
  uniform vec3 uStones[${MAX_STONES}]; // x, z, raio
  varying vec2 vLocal;
  varying float vDent;

  void main() {
    // Linhas paralelas de ancinho...
    float rake = sin(vLocal.y * 11.0);
    // ...que viram anéis concêntricos em volta das pedras
    for (int i = 0; i < ${MAX_STONES}; i++) {
      vec3 s = uStones[i];
      float d = distance(vLocal, s.xy);
      float ring = smoothstep(s.z + 1.6, s.z + 1.2, d);
      rake = mix(rake, sin((d - s.z) * 11.0), ring);
    }
    float shade = 0.9 + 0.08 * rake - vDent * 0.12;
    // Bordas da areia se dissolvem na cena em vez de um retângulo duro
    float edge = smoothstep(0.0, 3.0, ${(GARDEN.size[0] / 2).toFixed(1)} - abs(vLocal.x))
               * smoothstep(0.0, 2.2, ${(GARDEN.size[1] / 2).toFixed(1)} - abs(vLocal.y));
    gl_FragColor = vec4(uSand * shade, uOpacity * edge);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

// 枯山水: jardim de areia rastelada com as 9 pedras do Stack (uma por categoria)
export default function ZenGarden() {
  const quality = useJourney((s) => s.quality);
  const range = useJourney((s) => s.sectionRanges.stack) ?? GARDEN.fallbackRange;
  const [start, end] = range;
  const curve = useMemo(() => createCameraCurve(), []);
  const groupRef = useRef(null);
  const stoneRefs = useRef([]);

  // Âncora do jardim: ponto da curva dentro da faixa do Stack, abaixo da câmera
  const anchor = useMemo(() => {
    const point = curve.getPointAt(start + (end - start) * GARDEN.anchor);
    return [point.x, point.y - GARDEN.groundDrop, point.z];
  }, [curve, start, end]);

  const sandDisplacement = QUALITY_SETTINGS[quality]?.sandDisplacement ?? false;
  const [segX, segZ] = GARDEN.segments[sandDisplacement ? 'high' : 'low'];
  const sandGeometry = useMemo(
    () => new PlaneGeometry(GARDEN.size[0], GARDEN.size[1], segX, segZ),
    [segX, segZ],
  );
  const stoneGeometry = useMemo(() => new DodecahedronGeometry(1, 0), []);

  const sandMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        fog: true,
        uniforms: UniformsUtils.merge([
          UniformsLib.fog,
          {
            uPointer: { value: new Vector3() },
            uPointerActive: { value: 0 },
            uDisplace: { value: 0 },
            uSand: { value: new Color() },
            uOpacity: { value: 0 },
            uStones: { value: GARDEN.stones.map((s) => new Vector3(s.x, s.z, s.r)) },
          },
        ]),
      }),
    [],
  );
  const stoneMaterials = useMemo(
    () => GARDEN.stones.map(() => new MeshBasicMaterial({ transparent: true })),
    [],
  );

  useEffect(() => () => sandGeometry.dispose(), [sandGeometry]);
  useEffect(
    () => () => {
      stoneGeometry.dispose();
      sandMaterial.dispose();
      stoneMaterials.forEach((m) => m.dispose());
    },
    [stoneGeometry, sandMaterial, stoneMaterials],
  );

  // Objetos reaproveitados a cada frame
  const scratch = useMemo(
    () => ({
      raycaster: new Raycaster(),
      ndc: new Vector2(),
      plane: new Plane(new Vector3(0, 1, 0), 0),
      hit: new Vector3(),
      stone: new Color(),
      accent: new Color(),
      target: new Color(),
      sand: new Color(),
    }),
    [],
  );
  const initialized = useRef(false);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const journey = journeyStore.getState();
    const { theme, activeStone, reducedMotion } = journey;
    const opacity = bandOpacity(effectiveProgress(journey), start, end, 0.05);
    group.visible = opacity > 0.001;
    if (!group.visible) return;

    const k = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    initialized.current = true;
    let pending = false;

    // Areia
    const u = sandMaterial.uniforms;
    scratch.sand.set(SCENE_ACCENTS[theme].sand);
    u.uSand.value.lerp(scratch.sand, k);
    u.uOpacity.value = opacity;
    u.uDisplace.value = sandDisplacement ? 1 : 0;

    // Cursor → ponto no chão do jardim
    const active = pointer.active && !reducedMotion && sandDisplacement;
    u.uPointerActive.value = active ? 1 : 0;
    if (active) {
      scratch.plane.constant = -anchor[1];
      scratch.ndc.set(pointer.x, pointer.y);
      scratch.raycaster.setFromCamera(scratch.ndc, state.camera);
      if (scratch.raycaster.ray.intersectPlane(scratch.plane, scratch.hit)) u.uPointer.value.copy(scratch.hit);
    }

    // Pedras: a ativa ganha a cor de acento e sobe um pouco
    scratch.stone.set(SCENE_ACCENTS[theme].stone);
    scratch.accent.set(THEMES[theme].accent);
    GARDEN.stones.forEach((spec, i) => {
      const mesh = stoneRefs.current[i];
      const material = stoneMaterials[i];
      if (!mesh) return;
      const isActive = activeStone === i;
      scratch.target.copy(isActive ? scratch.accent : scratch.stone);
      material.color.lerp(scratch.target, k);
      material.opacity = opacity;
      const lift = isActive ? spec.r * 0.35 : 0;
      mesh.position.y += (spec.r * 0.35 + lift - mesh.position.y) * k;
      const c = material.color;
      if (Math.abs(c.r - scratch.target.r) + Math.abs(c.g - scratch.target.g) + Math.abs(c.b - scratch.target.b) > 0.002) {
        pending = true;
      }
    });

    if (pending) state.invalidate();
  });

  return (
    <group ref={groupRef} position={anchor}>
      <mesh geometry={sandGeometry} material={sandMaterial} rotation={[-Math.PI / 2, 0, 0]} />
      {GARDEN.stones.map((spec, i) => (
        <mesh
          key={i}
          ref={(m) => {
            stoneRefs.current[i] = m;
          }}
          geometry={stoneGeometry}
          material={stoneMaterials[i]}
          position={[spec.x, spec.r * 0.35, spec.z]}
          scale={[spec.r, spec.r * 0.6, spec.r * 0.85]}
          rotation={[0, i * 1.3, 0]}
        />
      ))}
      <Fireflies range={range} />
    </group>
  );
}
