'use client';
import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { journeyStore } from '../../store/journey';
import { stepWind } from '../../lib/journey/wind';
import Atmosphere from './Atmosphere';
import JourneyCamera from './JourneyCamera';
import MountainLayers from './MountainLayers';
import Petals from './Petals';
import Torii from './Torii';
import Iwakura from './Iwakura';
import { Katana, Komainu, Pagoda, ShishiOdoshi, StoneLanterns, StonePaths, Taikobashi } from './ShrineProps';
import { BambooGrove, Kodama } from './BambooGrove';
import Celestial from './Celestial';
import ZenGarden from './ZenGarden';
import Ground from './Ground';
import Momiji from './Momiji';
import Snow from './Snow';
import River from './River';
import Sky from './Sky';
import Kasumi from './Kasumi';
import Birds from './Birds';

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

  // 風神: a rajada do scroll é atualizada uma vez por frame; pétalas e bambus só leem
  useFrame((_, delta) => {
    stepWind(delta);
  });

  return (
    <>
      <Atmosphere />
      <JourneyCamera />
      <Sky />
      <Celestial />
      <Birds />
      <MountainLayers />
      <Ground />
      <Kasumi />
      <Torii />
      <Iwakura />
      <Komainu />
      <StonePaths />
      <StoneLanterns />
      <BambooGrove />
      <Kodama />
      <ShishiOdoshi />
      <Pagoda />
      <Taikobashi />
      <Katana />
      <ZenGarden />
      <Momiji />
      <Snow />
      <River />
      <Petals />
    </>
  );
}
