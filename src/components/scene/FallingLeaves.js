'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, InstancedBufferAttribute, PlaneGeometry, Vector2, Vector3 } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { createPetalData } from '../../lib/journey/petals';
import { SCENE_ACCENTS } from '../../lib/palette';
import { pointer } from '../../lib/pointer';
import { wind } from '../../lib/journey/wind';

const vertexShader = /* glsl */ `
  attribute vec3 aOffset;
  attribute vec3 aParams; // fase, queda, giro
  uniform float uTime;
  uniform float uGust;
  uniform vec2 uPointer;
  uniform float uPointerActive;
  uniform float uAspect;
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
    // Fūjin: a rajada acumulada (uGust) arrasta tudo para o lado, mais as peças mais leves
    p.x = uVolumeMin.x + mod(p.x - uVolumeMin.x + t * 0.8 + uGust * (0.6 + aParams.y) + sin(t + aParams.x) * 0.6, uVolumeSize.x);
    p.z += cos(t * 0.7 + aParams.x) * 0.4;

    // Giro da pétala em torno do próprio centro
    vec3 local = position;
    local.xy = rot(t * aParams.z + aParams.x) * local.xy;
    local.yz = rot(t * aParams.z * 0.7) * local.yz;

    vUv = uv;
    vShade = 0.75 + 0.25 * sin(aParams.x + t);

    vec4 clip = projectionMatrix * modelViewMatrix * vec4(p + local, 1.0);

    // Afasta do cursor em espaço de tela. As coordenadas normalizadas vão de -1 a 1 nos dois
    // eixos, então mede em espaço "quadrado" (x vezes a proporção): a zona livre é um círculo
    vec2 away = clip.xy / clip.w - uPointer;
    away.x *= uAspect;
    float push = uPointerActive * smoothstep(0.25, 0.0, length(away)) * 0.12;
    vec2 shift = normalize(away + 1e-5) * push;
    shift.x /= uAspect;
    clip.xy += shift * clip.w;

    gl_Position = clip;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uShape; // 0 = pétala (elipse), 1 = folha de momiji (5 lobos)
  varying vec2 vUv;
  varying float vShade;

  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    // Pétala: elipse suave no quad
    float petal = 1.0 - smoothstep(0.8, 1.0, length(q * vec2(1.0, 1.4)));
    // Momiji: raio varia com o ângulo formando 5 pontas
    float a = atan(q.y, q.x) + 1.5708;
    float r = 0.5 + 0.45 * pow(abs(cos(2.5 * a)), 0.6);
    float maple = 1.0 - smoothstep(r - 0.12, r, length(q));
    float shape = mix(petal, maple, uShape);
    if (shape < 0.01) discard;
    gl_FragColor = vec4(uColor * vShade, shape * uOpacity);
    #include <colorspace_fragment>
  }
`;

// Partículas instanciadas caindo com vento (pétalas de sakura, folhas de momiji).
// `weight(journey)` diz quanto aparecem (0–1); `volume` é a caixa onde caem.
export default function FallingLeaves({ volume, seed = 7, size = [0.22, 0.16], accent, shape = 0, weight, countScale = 1 }) {
  const quality = useJourney((s) => s.quality);
  const count = Math.round(QUALITY_SETTINGS[quality].particles * countScale);
  const meshRef = useRef(null);
  const [w, h] = size;
  const { x: vx, y: vy, z: vz } = volume;

  const geometry = useMemo(() => {
    const g = new PlaneGeometry(w, h);
    const { offsets, params } = createPetalData(count, seed, { x: vx, y: vy, z: vz });
    g.setAttribute('aOffset', new InstancedBufferAttribute(offsets, 3));
    g.setAttribute('aParams', new InstancedBufferAttribute(params, 3));
    return g;
  }, [count, seed, w, h, vx[0], vx[1], vy[0], vy[1], vz[0], vz[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGust: { value: 0 },
      uPointer: { value: new Vector2() },
      uPointerActive: { value: 0 },
      uAspect: { value: 1 },
      uVolumeMin: { value: new Vector3() },
      uVolumeSize: { value: new Vector3() },
      uColor: { value: new Color() },
      uOpacity: { value: 1 },
      uShape: { value: shape },
    }),
    [shape],
  );
  uniforms.uVolumeMin.value.set(vx[0], vy[0], vz[0]);
  uniforms.uVolumeSize.value.set(vx[1] - vx[0], vy[1] - vy[0], vz[1] - vz[0]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const journey = journeyStore.getState();
    const { theme, reducedMotion } = journey;
    const opacity = weight(journey);
    mesh.visible = opacity > 0.001;
    if (!mesh.visible) return;

    uniforms.uOpacity.value = opacity;
    uniforms.uColor.value.set(SCENE_ACCENTS[theme][accent]);
    uniforms.uPointer.value.set(pointer.x, pointer.y);
    uniforms.uPointerActive.value = pointer.active && !reducedMotion ? 1 : 0;
    uniforms.uAspect.value = state.size.width / Math.max(1, state.size.height);
    if (!reducedMotion) {
      uniforms.uTime.value += delta;
      // A rajada empurra mais quanto mais forte (acumula: as peças não voltam quando o vento passa)
      uniforms.uGust.value += wind.gust * delta * 9;
    }
  });

  return (
    <instancedMesh key={count} ref={meshRef} args={[geometry, null, count]} frustumCulled={false}>
      <shaderMaterial
        args={[{ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, side: DoubleSide }]}
      />
    </instancedMesh>
  );
}
