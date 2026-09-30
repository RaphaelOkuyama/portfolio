'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils } from 'three';
import { journeyStore, effectiveProgress, useJourney } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { smoothstep } from '../../lib/journey/math';
import { createCameraCurve } from './cameraCurve';
import Lanterns from './Lanterns';
import { RIVER } from './config';

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vLocal;
  void main() {
    vLocal = position.xy;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uWater;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vLocal;
  void main() {
    // Correnteza: faixas que descem o rio com leve ondulação lateral
    float flow = sin(vLocal.y * 2.6 + uTime * 1.4 + sin(vLocal.x * 1.7 + uTime * 0.6) * 0.8);
    float glint = smoothstep(0.97, 1.0, flow) * 0.12;
    // Margens se fundem com o chão
    float edge = smoothstep(0.0, 1.2, ${RIVER.size[0] / 2}.0 - abs(vLocal.x));
    vec3 color = uWater * (0.9 + 0.1 * flow) + glint;
    gl_FragColor = vec4(color, uOpacity * edge);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

// Rio escuro ao fim da jornada, onde as lanternas do contato descem
export default function River() {
  const start = useJourney((s) => s.sectionRanges.contato?.[0]) ?? RIVER.fallbackStart;
  const curve = useMemo(() => createCameraCurve(), []);
  const groupRef = useRef(null);

  // Centro do rio: um pouco adiante e abaixo do fim do caminho da câmera
  const center = useMemo(() => {
    const end = curve.getPointAt(1);
    return [end.x, end.y - RIVER.drop, end.z + RIVER.offsetZ];
  }, [curve]);

  const geometry = useMemo(() => new PlaneGeometry(RIVER.size[0], RIVER.size[1], 1, 1), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        fog: true,
        uniforms: UniformsUtils.merge([
          UniformsLib.fog,
          { uWater: { value: new Color() }, uTime: { value: 0 }, uOpacity: { value: 0 } },
        ]),
      }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const target = useMemo(() => new Color(), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const journey = journeyStore.getState();
    const opacity = smoothstep(start - 0.06, start + 0.01, effectiveProgress(journey));
    group.visible = opacity > 0.001;
    if (!group.visible) return;
    const u = material.uniforms;
    target.set(SCENE_ACCENTS[journey.theme].water);
    u.uWater.value.lerp(target, 1 - Math.exp(-delta * 4));
    u.uOpacity.value = opacity;
    if (!journey.reducedMotion) u.uTime.value += delta;
  });

  return (
    <group ref={groupRef} position={center}>
      <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />
      <Lanterns />
    </group>
  );
}
