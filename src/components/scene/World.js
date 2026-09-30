'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { journeyStore } from '../../store/journey';
import Atmosphere from './Atmosphere';
import JourneyCamera from './JourneyCamera';
import MountainLayers from './MountainLayers';

// Monta a cena; no frameloop "demand" qualquer mudança da store pede um frame
export default function World() {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => journeyStore.subscribe(() => invalidate()), [invalidate]);

  return (
    <>
      <Atmosphere />
      <JourneyCamera />
      <MountainLayers />
    </>
  );
}
