'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';
import { journeyStore } from '../../store/journey';
import { tsukuyomi } from '../../lib/journey/tsukuyomi';
import { COMET, cometPhase, cometPieces } from '../../lib/journey/comet';
import { NOISE } from './glsl';

// 彗星: o cometa da noite que se parte em dois (homenagem a Kimi no Na wa). Fica num plano do céu
// preso à câmera (como as estrelas), atrás de tudo; cada pedaço é um quad com cabeça e cauda
// pintadas no shader, alinhado ao rumo do movimento. Só à noite e sem movimento reduzido

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uFade;
  uniform float uBurn;
  uniform float uTime;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    // u: da ponta da cauda (0) à cabeça (1); v: atravessado (-1..1)
    float u = vUv.x;
    float v = (vUv.y - 0.5) * 2.0;
    vec2 h = vec2((u - 0.86) * 7.0, v * 1.6);
    float core = exp(-dot(h, h) * 3.0);
    // Some antes das bordas do quad (sem corte reto na frente da cabeça)
    float frame = smoothstep(1.0, 0.9, u) * smoothstep(1.0, 0.75, abs(v));
    float flare = exp(-dot(h, h) * 0.6) * 0.35 * frame;
    // Cauda: larga e apagada atrás, fina e forte perto da cabeça
    float w = mix(0.95, 0.14, pow(u, 1.4));
    float across = abs(v) / w;
    float body = pow(clamp(u / 0.86, 0.0, 1.0), 2.0) * smoothstep(0.92, 0.86, u);
    float tail = body * exp(-across * across);
    // Faixas de aurora ao longo da cauda (ruído esticado que corre para trás)
    float streaks = 0.65 + 0.35 * fbm(vec2(u * 3.0 - uTime * 0.4, v * 9.0));
    // Cores do Tiamat: miolo branco-ciano, faixa turquesa, borda violeta e rosa
    vec3 cyan = vec3(0.45, 0.95, 1.0);
    vec3 teal = vec3(0.25, 0.75, 0.95);
    vec3 violet = vec3(0.52, 0.42, 1.0);
    vec3 pink = vec3(1.0, 0.5, 0.82);
    vec3 col = mix(cyan, teal, smoothstep(0.0, 0.45, across));
    col = mix(col, violet, smoothstep(0.35, 0.8, across));
    col = mix(col, pink, smoothstep(0.7, 1.15, across));
    // O pedaço que cai esquenta ao entrar na atmosfera: rosa-alaranjado perto da cabeça
    col = mix(col, vec3(1.0, 0.62, 0.5), uBurn * smoothstep(0.5, 0.86, u) * 0.6);
    col = mix(col, vec3(0.92, 0.98, 1.0), core);
    float edge = body * exp(-pow(max(across - 0.7, 0.0) * 2.5, 2.0)) * smoothstep(0.5, 1.0, across) * 0.55;
    float alpha = (tail * 0.6 * streaks + edge + core * frame + flare * (0.5 + uBurn)) * uFade;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

export default function Comet() {
  const geometry = useMemo(() => new PlaneGeometry(1, 1), []);
  const materials = useMemo(() => [0, 1].map(() => new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: AdditiveBlending,
    uniforms: { uFade: { value: 0 }, uBurn: { value: 0 }, uTime: { value: 0 } },
  })), []);
  useEffect(() => () => {
    geometry.dispose();
    materials.forEach((m) => m.dispose());
  }, [geometry, materials]);

  const refs = useRef([]);
  const clock = useRef(0);
  const night = useRef(0);
  const tmp = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const { theme, reducedMotion } = journeyStore.getState();
    night.current += ((theme === 'night' ? 1 : 0) - night.current) * (1 - Math.exp(-delta * 2));
    if (!reducedMotion) clock.current += Math.min(delta, 1 / 20);
    const pieces = reducedMotion || night.current < 0.02 ? [] : cometPieces(cometPhase(clock.current));
    // Some no céu vermelho do tsukuyomi
    const strength = night.current * (1 - tsukuyomi.mix);
    const { camera } = state;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const piece = pieces[i];
      mesh.visible = Boolean(piece);
      if (!piece) return;
      // Plano do céu preso à câmera: (x, y) desse plano, a uma distância fixa
      const len = COMET.length * piece.size;
      const angle = Math.atan2(piece.dy, piece.dx);
      // O centro do quad fica atrás da cabeça (a cauda se estende para trás)
      tmp.set(piece.x - Math.cos(angle) * len * 0.36, piece.y - Math.sin(angle) * len * 0.36, -COMET.distance);
      mesh.position.copy(tmp.applyMatrix4(camera.matrixWorld));
      mesh.quaternion.copy(camera.quaternion);
      mesh.rotateZ(angle);
      mesh.scale.set(len, COMET.width * piece.size * 1.25, 1);
      const mu = materials[i].uniforms;
      mu.uFade.value = piece.fade * strength;
      mu.uBurn.value = i === 1 ? Math.min(1, piece.fade * 1.2) : 0;
      mu.uTime.value = clock.current;
    });
    if (pieces.length) state.invalidate();
  });

  return [0, 1].map((i) => (
    <mesh
      key={i}
      ref={(m) => { refs.current[i] = m; }}
      geometry={geometry}
      material={materials[i]}
      visible={false}
      renderOrder={-5}
      frustumCulled={false}
    />
  ));
}
