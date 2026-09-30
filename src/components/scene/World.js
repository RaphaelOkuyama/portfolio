'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { journeyStore } from '../../store/journey';
import Atmosphere from './Atmosphere';
import JourneyCamera from './JourneyCamera';
import MountainLayers from './MountainLayers';
import Petals from './Petals';
import Torii from './Torii';
import Celestial from './Celestial';

// Monta a cena; no frameloop "demand" qualquer mudança da store pede um frame
export default function World() {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(
    () =>
      journeyStore.subscribe((state, prev) => {
        const changed =
          state.theme !== prev.theme ||
          state.seasonMix !== prev.seasonMix ||
          state.route !== prev.route ||
          state.quality !== prev.quality ||
          (state.route === 'journey' && state.progress !== prev.progress);
        if (changed) invalidate();
      }),
    [invalidate],
  );

  return (
    <>
      <Atmosphere />
      <JourneyCamera />
      <Celestial />
      <MountainLayers />
      <Torii />
      <Petals />
    </>
  );
}
