'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { journeyStore } from '../../store/journey';
import { groundHeight } from '../../lib/journey/ground';
import { wind } from '../../lib/journey/wind';
import { useAccentMaterials } from './useAccentMaterials';
import { bonsaiGeometry } from './bonsaiGeometry';
import { BONSAI, GROUND } from './config';

// 盆栽: o pinheiro na mesinha, à beira do caminho, entre as lanternas de pedra. A copa mexe de leve com o vento do scroll
export default function Bonsai() {
  const { craft } = useAccentMaterials({ craft: { accent: 'craft' } });
  const { wood, foliage } = bonsaiGeometry();
  const crown = useRef(null);
  const clock = useRef(0);
  const { x, z, rotY, scale } = BONSAI;

  useFrame((_, delta) => {
    if (!crown.current || journeyStore.getState().reducedMotion) return;
    clock.current += Math.min(delta, 1 / 20);
    const t = clock.current;
    crown.current.rotation.z = Math.sin(t * 0.8) * 0.006 + wind.gust * 0.02;
    crown.current.rotation.x = Math.sin(t * 0.6 + 1) * 0.004;
  });

  return (
    <group position={[x, groundHeight(x, z, GROUND), z]} rotation={[0, rotY, 0]} scale={scale}>
      <mesh geometry={wood} material={craft} dispose={null} />
      <group ref={crown}>
        <mesh geometry={foliage} material={craft} dispose={null} />
      </group>
    </group>
  );
}
