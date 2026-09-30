'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from 'three';
import { journeyStore, effectiveProgress, useJourney } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { createPetalData } from '../../lib/journey/petals';
import { bandOpacity, summerWeight } from '../../lib/journey/math';
import { GARDEN } from './config';

// Um vaga-lume a cada 5 partículas do orçamento de qualidade
const FIREFLY_RATIO = 5;

// Ponto redondo com brilho suave; tamanho em pixels limitado para não virar um borrão perto da câmera
const vertexShader = /* glsl */ `
  uniform float uPixelRatio;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(28.0 / -mv.z, 1.5, 7.0) * uPixelRatio;
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    if (glow < 0.01) discard;
    gl_FragColor = vec4(uColor, glow * glow * uOpacity);
    #include <colorspace_fragment>
  }
`;

// Vaga-lumes sobre o jardim: só à noite, no auge do verão
export default function Fireflies({ range }) {
  const quality = useJourney((s) => s.quality);
  const count = Math.round((QUALITY_SETTINGS[quality]?.particles ?? 300) / FIREFLY_RATIO);
  const pointsRef = useRef(null);
  const [start, end] = range;

  const { geometry, base, params } = useMemo(() => {
    const { offsets, params: p } = createPetalData(count, 29, GARDEN.fireflyVolume);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(offsets), 3));
    return { geometry: g, base: offsets, params: p };
  }, [count]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uColor: { value: new Color() }, uOpacity: { value: 0 }, uPixelRatio: { value: 1 } },
      }),
    [],
  );
  const night = useRef(0);
  const time = useRef(0);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    const journey = journeyStore.getState();
    const k = 1 - Math.exp(-delta * 4);
    night.current += ((journey.theme === 'night' ? 1 : 0) - night.current) * k;

    const opacity =
      night.current * summerWeight(journey.seasonMix) * bandOpacity(effectiveProgress(journey), start, end, 0.05);
    points.visible = opacity > 0.01;
    if (!points.visible) return;

    if (!journey.reducedMotion) time.current += delta;
    const t = time.current;
    const u = material.uniforms;
    u.uColor.value.set(SCENE_ACCENTS[journey.theme].firefly);
    u.uPixelRatio.value = state.gl.getPixelRatio();
    // Pisca devagar
    u.uOpacity.value = opacity * (0.65 + 0.35 * Math.sin(t * 2.3));

    // Deriva suave em volta da posição inicial
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const phase = params[i * 3];
      const speed = params[i * 3 + 1];
      pos[i * 3] = base[i * 3] + Math.sin(t * speed + phase) * 0.6;
      pos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * speed * 1.7 + phase) * 0.3;
      pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * speed + phase) * 0.6;
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return <points key={count} ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
