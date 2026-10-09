'use client';
import { useMemo } from 'react';
import { groundHeight } from '../../lib/journey/ground';
import { useAccentMaterials } from './useAccentMaterials';
import {
  chochinGeometry, maskBoardGeometry, maskGeometry, maskStallGeometry, maskTexture, sensuGeometry, STALL_MASKS, uchiwaGeometry,
} from './festivalGeometry';
import { FESTIVAL, GROUND } from './config';

// Cores das peças (nos vértices) e do papel dos leques
const SENSU_RED = [[0.78, 0.13, 0.1], [0.97, 0.93, 0.84]];
const SENSU_INDIGO = [[0.17, 0.24, 0.45], [0.97, 0.93, 0.84]];

function Piece({ geometry, material, position, rotation, scale }) {
  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} scale={scale} dispose={null} />;
}

// お面屋: a barraca de máscaras com leques no balcão e a lanterna vermelha pendurada
export function MaskStall({ material, maskMaterial }) {
  const { x, z, rotY, scale } = FESTIVAL.stall;
  return (
    <group position={[x, groundHeight(x, z, GROUND), z]} rotation={[0, rotY, 0]} scale={scale}>
      <Piece geometry={maskStallGeometry()} material={material} />
      {/* Máscaras nos cordões do painel (o layout e os cordões vêm de festivalGeometry) */}
      {STALL_MASKS.map(([kind, mx, my, tilt]) => (
        <Piece key={`${kind}${mx}`} geometry={maskGeometry(kind)} material={maskMaterial} position={[mx, my, -0.48]} rotation={[0, 0, tilt]} scale={0.6} />
      ))}
      <Piece geometry={uchiwaGeometry()} material={material} position={[0.4, 1.52, -0.54]} rotation={[0, 0, -0.3]} scale={0.5} />
      {/* No balcão: um leque aberto em pé e outro deitado, meio fechado */}
      <Piece geometry={sensuGeometry(SENSU_RED)} material={material} position={[-0.75, 0.98, 0.45]} rotation={[-0.2, 0.25, 0]} scale={0.42} />
      <Piece geometry={sensuGeometry(SENSU_INDIGO)} material={material} position={[0.6, 0.98, 0.5]} rotation={[-1.2, -0.3, 0]} scale={0.36} />
      <Piece geometry={chochinGeometry()} material={material} position={[1.25, 1.98, 1.1]} scale={0.3} />
      <Piece geometry={chochinGeometry()} material={material} position={[-1.25, 1.98, 1.1]} scale={0.3} />
    </group>
  );
}

// 扇子: dois leques abertos num suporte baixo, ao lado da katana na margem
function FanDisplay({ material }) {
  const { x, z, rotY, scale } = FESTIVAL.fans;
  return (
    <group position={[x, groundHeight(x, z, GROUND), z]} rotation={[0, rotY, 0]} scale={scale}>
      <Piece geometry={maskBoardGeometry()} material={material} position={[0, -1.25, -0.2]} scale={[0.6, 0.6, 0.6]} />
      <Piece geometry={sensuGeometry(SENSU_INDIGO)} material={material} position={[-0.35, 0.32, 0]} rotation={[0, 0, 0.18]} scale={0.48} />
      <Piece geometry={sensuGeometry(SENSU_RED)} material={material} position={[0.35, 0.32, 0.02]} rotation={[0, 0, -0.18]} scale={0.48} />
    </group>
  );
}

// 祭り: máscaras e leques espalhados pelo caminho
export default function Festival() {
  const { craft, masks } = useAccentMaterials({ craft: { accent: 'craft', double: true }, masks: { accent: 'craft', double: true } });
  // As máscaras levam a pintura (olhos, marcas, cabelo) num atlas gerado em código
  useMemo(() => {
    masks.map = maskTexture();
    masks.needsUpdate = true;
  }, [masks]);
  return (
    <>
      <MaskStall material={craft} maskMaterial={masks} />
      <FanDisplay material={craft} />
    </>
  );
}
