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
import SenbonTorii from './SenbonTorii';
import ZenGarden from './ZenGarden';
import Momiji from './Momiji';
import Snow from './Snow';
import River from './River';

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
          state.activeStone !== prev.activeStone ||
          state.lanternReleases !== prev.lanternReleases ||
          state.lost !== prev.lost ||
          state.sectionRanges !== prev.sectionRanges ||
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
      <SenbonTorii />
      <ZenGarden />
      <Momiji />
      <Snow />
      <River />
      <Petals />
    </>
  );
}
