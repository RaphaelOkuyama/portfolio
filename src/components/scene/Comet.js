'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';
import { journeyStore } from '../../store/journey';
import { tsukuyomi } from '../../lib/journey/tsukuyomi';
import { COMET, cometPhase, cometPieces } from '../../lib/journey/comet';

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
  varying vec2 vUv;
  void main() {
    // u: da ponta da cauda (0) à cabeça (1); v: atravessado (-1..1)
    float u = vUv.x;
    float v = (vUv.y - 0.5) * 2.0;
    vec2 h = vec2((u - 0.93) * 7.0, v * 1.6);
    float core = exp(-dot(h, h) * 3.0);
    // Cauda: larga e apagada atrás, fina e forte perto da cabeça
    float w = mix(0.9, 0.12, pow(u, 1.5));
    float tail = pow(clamp(u / 0.93, 0.0, 1.0), 2.2) * exp(-v * v / (w * w)) * step(u, 0.95);
    // Duas faixas na cauda (poeira e gás) em tons diferentes
    vec3 col = mix(vec3(0.55, 0.75, 1.0), vec3(1.0, 0.86, 0.7), smoothstep(-0.3, 0.6, v));
    col = mix(col, vec3(1.0), core);
    float alpha = (tail * 0.55 + core) * uFade;
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
    uniforms: { uFade: { value: 0 } },
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
      tmp.set(piece.x - Math.cos(angle) * len * 0.43, piece.y - Math.sin(angle) * len * 0.43, -COMET.distance);
      mesh.position.copy(tmp.applyMatrix4(camera.matrixWorld));
      mesh.quaternion.copy(camera.quaternion);
      mesh.rotateZ(angle);
      mesh.scale.set(len, COMET.width * piece.size, 1);
      materials[i].uniforms.uFade.value = piece.fade * strength;
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
