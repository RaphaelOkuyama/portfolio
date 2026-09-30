'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MeshBasicMaterial } from 'three';
import { journeyStore } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { toriiGeometry } from './toriiGeometry';

// Materiais do torii (corpo vermelho + topo escuro) com crossfade 昼/夜.
// Compartilhados por todos os portões de um mesmo componente.
export function useToriiMaterials() {
  const body = useMemo(() => new MeshBasicMaterial({ vertexColors: true }), []);
  const top = useMemo(() => new MeshBasicMaterial({ vertexColors: true }), []);
  const target = useMemo(() => ({ body: new Color(), top: new Color() }), []);
  const initialized = useRef(false);

  useEffect(
    () => () => {
      body.dispose();
      top.dispose();
    },
    [body, top],
  );

  useFrame((state, delta) => {
    const { theme } = journeyStore.getState();
    target.body.set(SCENE_ACCENTS[theme].torii);
    target.top.set(SCENE_ACCENTS[theme].toriiTop);
    // Primeiro frame aplica direto; depois acompanha o crossfade 昼/夜
    const k = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    initialized.current = true;
    body.color.lerp(target.body, k);
    top.color.lerp(target.top, k);
    const c = body.color;
    if (Math.abs(c.r - target.body.r) + Math.abs(c.g - target.body.g) + Math.abs(c.b - target.body.b) > 0.002) {
      state.invalidate();
    }
  });

  return { body, top };
}

// Um portão low-poly (pilares afunilados, nuki, gakuzuka, shimaki e kasagi com pontas curvadas).
// A base fica na origem do grupo. `body` pinta as partes vermelhas, `top` as escuras.
// dispose={null}: as geometrias ficam em cache e são compartilhadas entre portões
export default function ToriiGate({ spec, body, top, ...groupProps }) {
  const geometry = toriiGeometry(spec);
  return (
    <group {...groupProps}>
      <mesh geometry={geometry.body} material={body} dispose={null} />
      <mesh geometry={geometry.dark} material={top} dispose={null} />
    </group>
  );
}
