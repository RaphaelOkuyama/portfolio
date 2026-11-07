'use client';
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { groundHeight } from '../../lib/journey/ground';
import { getCameraCurve } from './useCameraMap';
import { NOISE, noiseDefines } from './glsl';
import { GROUND } from './config';

// Névoa rasteira: lençóis deitados um pouco acima do chão ao longo do caminho, com ruído à deriva.
// Vistos de raspão, viram a bruma baixa que a câmera atravessa (perto da lente eles somem)
const SHEETS = 9;
const SIZE = [46, 26];
const LIFT = 0.55;

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3 uCenter;
  varying vec3 vWorld;
  varying float vDepth;
  ${NOISE}
  void main() {
    vec2 p = vWorld.xz * 0.06 + vec2(uTime * 0.012, uTime * 0.004);
    float n = fbm(p) * 0.7 + fbm(p * 2.3 + 11.0) * 0.3;
    float body = smoothstep(0.42, 0.72, n);
    // Bordas do lençol somem (sem recorte reto) e perto da câmera ele abre
    vec2 local = abs(vWorld.xz - uCenter.xz) / vec2(${(SIZE[0] / 2).toFixed(1)}, ${(SIZE[1] / 2).toFixed(1)});
    float edge = (1.0 - smoothstep(0.55, 1.0, local.x)) * (1.0 - smoothstep(0.45, 1.0, local.y));
    float near = smoothstep(2.5, 9.0, vDepth);
    gl_FragColor = vec4(uColor, body * edge * near * uOpacity);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const LOOK = { night: { opacity: 0.32, lighten: 0.14 }, day: { opacity: 0.4, lighten: 0.35 } };

export default function GroundMist() {
  const quality = useJourney((s) => s.quality);
  const sheets = useMemo(() => {
    const curve = getCameraCurve();
    return Array.from({ length: SHEETS }, (_, i) => {
      const p = curve.getPointAt(0.08 + (i / SHEETS) * 0.85);
      return [p.x, groundHeight(p.x, p.z, GROUND) + LIFT, p.z];
    });
  }, []);
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(SIZE[0], SIZE[1]);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const materials = useMemo(() => sheets.map((center) => new ShaderMaterial({
    vertexShader,
    fragmentShader,
    defines: noiseDefines(quality),
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    fog: true,
    uniforms: UniformsUtils.merge([UniformsLib.fog, {
      uColor: { value: new Color() },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uCenter: { value: center },
    }]),
  })), [sheets, quality]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  const white = useMemo(() => new Color('#ffffff'), []);
  useFrame((state, delta) => {
    const { theme, reducedMotion } = journeyStore.getState();
    const look = LOOK[theme] ?? LOOK.night;
    const fog = state.scene.fog?.color;
    materials.forEach((m) => {
      const u = m.uniforms;
      if (fog) u.uColor.value.copy(fog).lerp(white, look.lighten);
      u.uOpacity.value += (look.opacity - u.uOpacity.value) * Math.min(1, delta * 3);
      if (!reducedMotion) u.uTime.value += delta;
    });
  });

  return sheets.map((center, i) => (
    <mesh key={i} geometry={geometry} material={materials[i]} position={center} renderOrder={2} dispose={null} />
  ));
}
