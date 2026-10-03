'use client';
import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useCameraMap } from './useCameraMap';
import { iwakuraGeometry } from './iwakuraGeometry';
import { useAccentMaterials } from './useAccentMaterials';
import { besideTorii } from './toriiFrame';
import { IWAKURA } from './config';

const PARTS = {
  rock: { accent: 'iwakura' },
  rope: { accent: 'shimenawa' },
  paper: { accent: 'shide', double: true },
};

// 磐座 (iwakura): a rocha sagrada amarrada com a corda 注連縄 e os papéis 紙垂, pousada no chão
// ao lado do torii do hero. Mesmo crossfade 昼/夜 dos materiais do torii
export default function Iwakura() {
  const { params } = useCameraMap();
  const materials = useAccentMaterials(PARTS);
  const geometry = iwakuraGeometry();
  // Celular em pé: não há espaço ao lado do torii sem a pedra ficar cortada atrás do texto
  const roomy = useThree((s) => s.size.width / s.size.height >= IWAKURA.minAspect);

  // Afunda um pouco no chão: pedra assentada, não pousada
  const { position, rotationY } = useMemo(() => {
    const { x, y, z, facing } = besideTorii(params.toriiT, IWAKURA.offset[0], IWAKURA.offset[1]);
    return { position: [x, y - IWAKURA.sink, z], rotationY: facing + IWAKURA.turn };
  }, [params.toriiT]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={IWAKURA.scale} visible={roomy}>
      <mesh geometry={geometry.rock} material={materials.rock} dispose={null} />
      <mesh geometry={geometry.rope} material={materials.rope} dispose={null} />
      <mesh geometry={geometry.straw} material={materials.rope} dispose={null} />
      <mesh geometry={geometry.paper} material={materials.paper} dispose={null} />
    </group>
  );
}
