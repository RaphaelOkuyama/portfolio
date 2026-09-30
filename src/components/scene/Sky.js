'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, Color, ShaderMaterial, SphereGeometry } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { NOISE, noiseDefines } from './glsl';
import { SKY } from './config';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uCloud;
  uniform float uStars;
  uniform float uClouds;
  uniform float uTime;
  varying vec3 vDir;
  ${NOISE}

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;
    float lon = atan(dir.x, -dir.z);

    // Degradê do horizonte (claro, na névoa) ao zênite
    vec3 col = mix(uHorizon, uZenith, pow(smoothstep(-0.05, 0.6, h), 0.75));

    // Nuvens em faixas alongadas, como nas gravuras: só numa faixa acima do horizonte
    vec2 cp = vec2(lon * 2.6 + uTime * 0.004, h * 11.0);
    float c = fbm(vec2(cp.x * 1.3, cp.y * 0.8));
    float band = smoothstep(0.0, 0.1, h) * (1.0 - smoothstep(0.28, 0.5, h));
    float cloud = smoothstep(0.5, 0.74, c) * band * uClouds;
    col = mix(col, uCloud, cloud * 0.6);

    // Estrelas (夜): uma por célula sorteada, cintilando devagar
    vec2 sp = vec2(lon, asin(clamp(h, -1.0, 1.0))) * 70.0;
    vec2 cell = floor(sp);
    float r = hash21(cell);
    vec2 jitter = vec2(hash21(cell + 3.1), hash21(cell + 7.7)) - 0.5;
    float star = step(0.975, r) * smoothstep(0.16, 0.0, length(fract(sp) - 0.5 - jitter * 0.6));
    star *= 0.55 + 0.45 * sin(uTime * (0.8 + r * 2.5) + r * 40.0);
    col += star * uStars * smoothstep(0.04, 0.3, h) * (1.0 - cloud);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const NIGHT = { zenith: 0.5, stars: 0.85, clouds: 0.8 };
const DAY = { zenith: 0.9, stars: 0, clouds: 1 };

// Céu pintado: esfera presa à câmera, atrás de tudo. Lê as cores já suavizadas pela Atmosphere
export default function Sky() {
  const scene = useThree((s) => s.scene);
  const quality = useJourney((s) => s.quality);
  const meshRef = useRef(null);
  const geometry = useMemo(() => new SphereGeometry(SKY.radius, 32, 16), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        defines: noiseDefines(quality),
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZenith: { value: new Color() },
          uHorizon: { value: new Color() },
          uCloud: { value: new Color() },
          uStars: { value: 0 },
          uClouds: { value: 1 },
          uTime: { value: 0 },
        },
      }),
    [quality],
  );
  const white = useMemo(() => new Color('#ffffff'), []);
  const mix = useRef(null);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const background = scene.background;
    if (!mesh || !background?.isColor || !scene.fog) return;
    mesh.position.copy(state.camera.position);

    const target = journeyStore.getState().theme === 'night' ? NIGHT : DAY;
    const k = mix.current ? 1 - Math.exp(-delta * 4) : 1;
    mix.current ??= { ...target };
    Object.keys(target).forEach((key) => {
      mix.current[key] += (target[key] - mix.current[key]) * k;
    });

    const u = material.uniforms;
    u.uHorizon.value.copy(scene.fog.color);
    u.uZenith.value.copy(background).multiplyScalar(mix.current.zenith);
    // Nuvens: um tom acima do horizonte (luar à noite, papel de dia)
    u.uCloud.value.copy(scene.fog.color).lerp(white, 0.12 + (1 - mix.current.zenith) * 0.1);
    u.uStars.value = mix.current.stars;
    u.uClouds.value = mix.current.clouds;
    u.uTime.value = state.clock.elapsedTime;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={-10} frustumCulled={false} />;
}
