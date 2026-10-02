'use client';
import { petalOpacity, PETAL_VOLUME } from '../../lib/journey/petals';
import FallingLeaves from './FallingLeaves';

const petalWeight = (journey) => petalOpacity(journey.seasonMix);

// Sakura: cai na primavera (hero) e foge do cursor; 60% do volume deixa o hero respirar
export default function Petals() {
  return <FallingLeaves volume={PETAL_VOLUME} accent="petal" weight={petalWeight} countScale={0.6} />;
}
