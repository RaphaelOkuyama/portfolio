'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, InstancedBufferAttribute, PlaneGeometry, Vector2, Vector3 } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { createPetalData, petalOpacity, PETAL_VOLUME } from '../../lib/journey/petals';
import { SCENE_ACCENTS } from '../../lib/palette';
import { pointer } from '../../lib/pointer';

const vertexShader = /* glsl */ `
  attribute vec3 aOffset;
  attribute vec3 aParams; // fase, queda, giro
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerActive;
  uniform vec3 uVolumeMin;
  uniform vec3 uVolumeSize;
  varying vec2 vUv;
  varying float vShade;

  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  void main() {
    float t = uTime * aParams.y;

    // Queda com vento: desce, deriva em x e oscila; volta ao topo ao sair do volume
    vec3 p = aOffset;
    p.y = uVolumeMin.y + mod(p.y - uVolumeMin.y - t * 1.2, uVolumeSize.y);
    p.x = uVolumeMin.x + mod(p.x - uVolumeMin.x + t * 0.8 + sin(t + aParams.x) * 0.6, uVolumeSize.x);
    p.z += cos(t * 0.7 + aParams.x) * 0.4;

    // Giro da pétala em torno do próprio centro
    vec3 local = position;
    local.xy = rot(t * aParams.z + aParams.x) * local.xy;
    local.yz = rot(t * aParams.z * 0.7) * local.yz;

    vUv = uv;
    vShade = 0.75 + 0.25 * sin(aParams.x + t);

    vec4 clip = projectionMatrix * modelViewMatrix * vec4(p + local, 1.0);

    // Afasta do cursor em espaço de tela
    vec2 away = clip.xy / clip.w - uPointer;
    float push = uPointerActive * smoothstep(0.25, 0.0, length(away)) * 0.12;
    clip.xy += normalize(away + 1e-5) * push * clip.w;

    gl_Position = clip;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vShade;

  void main() {
    // Elipse suave no quad
    vec2 q = vUv * 2.0 - 1.0;
    float shape = 1.0 - smoothstep(0.8, 1.0, length(q * vec2(1.0, 1.4)));
    if (shape < 0.01) discard;
    gl_FragColor = vec4(uColor * vShade, shape * uOpacity);
    #include <colorspace_fragment>
  }
`;

// Sakura instanciada: cai na primavera e foge do cursor
export default function Petals() {
  const quality = useJourney((s) => s.quality);
  const count = QUALITY_SETTINGS[quality].particles;
  const meshRef = useRef(null);
  const materialRef = useRef(null);

  const geometry = useMemo(() => {
    const g = new PlaneGeometry(0.22, 0.16);
    const { offsets, params } = createPetalData(count);
    g.setAttribute('aOffset', new InstancedBufferAttribute(offsets, 3));
    g.setAttribute('aParams', new InstancedBufferAttribute(params, 3));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new Vector2() },
      uPointerActive: { value: 0 },
      uVolumeMin: { value: new Vector3(PETAL_VOLUME.x[0], PETAL_VOLUME.y[0], PETAL_VOLUME.z[0]) },
      uVolumeSize: {
        value: new Vector3(
          PETAL_VOLUME.x[1] - PETAL_VOLUME.x[0],
          PETAL_VOLUME.y[1] - PETAL_VOLUME.y[0],
          PETAL_VOLUME.z[1] - PETAL_VOLUME.z[0],
        ),
      },
      uColor: { value: new Color() },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { theme, seasonMix, reducedMotion } = journeyStore.getState();
    const opacity = petalOpacity(seasonMix);
    mesh.visible = opacity > 0.001;
    if (!mesh.visible) return;

    uniforms.uOpacity.value = opacity;
    uniforms.uColor.value.set(SCENE_ACCENTS[theme].petal);
    uniforms.uPointer.value.set(pointer.x, pointer.y);
    uniforms.uPointerActive.value = pointer.active ? 1 : 0;
    if (!reducedMotion) uniforms.uTime.value += delta;
  });

  return (
    <instancedMesh key={count} ref={meshRef} args={[geometry, null, count]} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        args={[{ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, side: DoubleSide }]}
      />
    </instancedMesh>
  );
}
