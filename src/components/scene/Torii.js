'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MeshBasicMaterial } from 'three';
import { journeyStore } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { TORII } from './config';

// Torii procedural: dois pilares, nuki (viga de baixo), shimaki + kasagi (topo escuro)
export default function Torii() {
  const body = useMemo(() => new MeshBasicMaterial(), []);
  const top = useMemo(() => new MeshBasicMaterial(), []);
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

  const { position, pillarHeight, pillarRadius, span, kasagiY, nukiY } = TORII;
  const half = span / 2;

  return (
    <group position={position}>
      {[-half, half].map((x) => (
        <mesh key={x} position={[x, pillarHeight / 2, 0]} material={body}>
          <cylinderGeometry args={[pillarRadius * 0.9, pillarRadius, pillarHeight, 16]} />
        </mesh>
      ))}
      <mesh position={[0, nukiY, 0]} material={body}>
        <boxGeometry args={[span + 0.8, 0.35, 0.4]} />
      </mesh>
      <mesh position={[0, (kasagiY + nukiY) / 2, 0]} material={body}>
        <boxGeometry args={[0.35, kasagiY - nukiY - 0.5, 0.3]} />
      </mesh>
      <mesh position={[0, kasagiY - 0.45, 0]} material={body}>
        <boxGeometry args={[span + 1.6, 0.35, 0.6]} />
      </mesh>
      <mesh position={[0, kasagiY, 0]} material={top}>
        <boxGeometry args={[span + 2.4, 0.5, 0.7]} />
      </mesh>
    </group>
  );
}
