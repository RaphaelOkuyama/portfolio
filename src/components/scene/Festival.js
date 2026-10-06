'use client';
import { groundHeight } from '../../lib/journey/ground';
import { useAccentMaterials } from './useAccentMaterials';
import {
  chochinGeometry, maskBoardGeometry, maskGeometry, maskStallGeometry, sensuGeometry, uchiwaGeometry,
} from './festivalGeometry';
import { FESTIVAL, GROUND } from './config';

// Cores das peças (nos vértices) e do papel dos leques
const SENSU_RED = [[0.78, 0.13, 0.1], [0.97, 0.93, 0.84]];
const SENSU_INDIGO = [[0.17, 0.24, 0.45], [0.97, 0.93, 0.84]];

// Máscaras penduradas no painel do fundo da barraca: [tipo, x, y]
const STALL_MASKS = [
  ['tengu', -0.9, 2.38], ['kitsune', 0, 2.38], ['oni', 0.9, 2.38],
  ['okame', -0.55, 1.58], ['hyottoko', 0.35, 1.58],
];

function Piece({ geometry, material, position, rotation, scale }) {
  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} scale={scale} dispose={null} />;
}

// お面屋: a barraca de máscaras com leques no balcão e a lanterna vermelha pendurada
function MaskStall({ material }) {
  const { x, z, rotY, scale } = FESTIVAL.stall;
  return (
    <group position={[x, groundHeight(x, z, GROUND), z]} rotation={[0, rotY, 0]} scale={scale}>
      <Piece geometry={maskStallGeometry()} material={material} />
      {STALL_MASKS.map(([kind, mx, my]) => (
        <Piece key={kind} geometry={maskGeometry(kind)} material={material} position={[mx, my, -0.5]} scale={0.62} />
      ))}
      <Piece geometry={uchiwaGeometry()} material={material} position={[1.05, 1.72, -0.55]} rotation={[0, 0, -0.3]} scale={0.55} />
      {/* No balcão: um leque aberto em pé e outro deitado, meio fechado */}
      <Piece geometry={sensuGeometry(SENSU_RED)} material={material} position={[-0.75, 0.98, 0.45]} rotation={[-0.2, 0.25, 0]} scale={0.42} />
      <Piece geometry={sensuGeometry(SENSU_INDIGO)} material={material} position={[0.6, 0.98, 0.5]} rotation={[-1.2, -0.3, 0]} scale={0.36} />
      <Piece geometry={chochinGeometry()} material={material} position={[1.25, 2.15, 0.82]} scale={0.32} />
      <Piece geometry={chochinGeometry()} material={material} position={[-1.25, 2.15, 0.82]} scale={0.32} />
    </group>
  );
}

// 大天狗: o tengu grande no painel de madeira com a corda sagrada
function TenguBoard({ material }) {
  const { x, z, rotY, scale } = FESTIVAL.tengu;
  return (
    <group position={[x, groundHeight(x, z, GROUND), z]} rotation={[0, rotY, 0]} scale={scale}>
      <Piece geometry={maskBoardGeometry()} material={material} />
      <Piece geometry={maskGeometry('tengu')} material={material} position={[0, 2.05, 0.2]} scale={1.35} />
      {/* Dois leques abertos dos lados, como nos santuários de Takao */}
      <Piece geometry={sensuGeometry(SENSU_RED)} material={material} position={[-0.62, 1.55, 0.06]} rotation={[0, 0, 0.5]} scale={0.38} />
      <Piece geometry={sensuGeometry(SENSU_RED)} material={material} position={[0.62, 1.55, 0.06]} rotation={[0, 0, -0.5]} scale={0.38} />
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
  const { craft } = useAccentMaterials({ craft: { accent: 'craft', double: true } });
  return (
    <>
      <MaskStall material={craft} />
      <TenguBoard material={craft} />
      <FanDisplay material={craft} />
    </>
  );
}
