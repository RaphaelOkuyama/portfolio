'use client';
import { petalOpacity, PETAL_VOLUME } from '../../lib/journey/petals';
import FallingLeaves from './FallingLeaves';

const petalWeight = (journey) => petalOpacity(journey.seasonMix);

// Nas telas deitadas o hero olha para a esquerda (ver lib/journey/shots): a caixa das pétalas
// se estende para lá, cobrindo também o lado do texto
const WIDE = { shift: -14, scale: 1.9 };

// Sakura: cai na primavera (hero) e foge do cursor; 60% do volume deixa o hero respirar
export default function Petals() {
  return <FallingLeaves volume={PETAL_VOLUME} accent="petal" weight={petalWeight} countScale={0.6} wide={WIDE} />;
}
