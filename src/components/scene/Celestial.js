'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import { journeyStore } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { CELESTIAL } from './config';

// Opacidade do disco e do halo por tema: a lua brilha mais que o sol pálido
const OPACITY = { night: { disc: 1, halo: 0.18 }, day: { disc: 0.55, halo: 0.1 } };

// Sol (昼) / lua (夜): disco com halo, fora da névoa
export default function Celestial() {
  const discRef = useRef(null);
  const haloRef = useRef(null);
  const target = useMemo(() => new Color(), []);
  const initialized = useRef(false);

  useFrame((state, delta) => {
    const disc = discRef.current;
    const halo = haloRef.current;
    if (!disc || !halo) return;
    const { theme } = journeyStore.getState();
    target.set(SCENE_ACCENTS[theme].celestial);
    const k = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    initialized.current = true;

    disc.color.lerp(target, k);
    halo.color.copy(disc.color);
    disc.opacity += (OPACITY[theme].disc - disc.opacity) * k;
    halo.opacity += (OPACITY[theme].halo - halo.opacity) * k;

    if (Math.abs(disc.opacity - OPACITY[theme].disc) > 0.002) state.invalidate();
  });

  return (
    <group position={CELESTIAL.position}>
      <mesh>
        <circleGeometry args={[CELESTIAL.radius * 2.2, 48]} />
        <meshBasicMaterial ref={haloRef} transparent opacity={0} fog={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[CELESTIAL.radius, 48]} />
        <meshBasicMaterial ref={discRef} transparent opacity={0} fog={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
