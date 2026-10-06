'use client';
import { memo, useEffect, useState } from 'react';
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
import Tanabata from './Tanabata';
import Ground from './Ground';
import Momiji from './Momiji';
import Snow from './Snow';
import River from './River';
import Sky from './Sky';
import Kasumi from './Kasumi';
import Birds from './Birds';
import Festival from './Festival';
import Bonsai from './Bonsai';
import ShaderWarmup from './ShaderWarmup';

// Grupos montados em sequência (ordem: o que aparece primeiro no hero vem antes)
const STAGES = [
  [Atmosphere, JourneyCamera, Sky, Celestial, Birds],
  [MountainLayers],
  [Ground, Kasumi],
  [Torii, Iwakura, Komainu, Festival],
  [StonePaths, StoneLanterns],
  [BambooGrove, Kodama, ShishiOdoshi, Bonsai],
  [Pagoda, Taikobashi, Katana],
  [Tanabata, Momiji, Snow],
  [River, Petals],
];

// memo: montar o grupo seguinte não re-renderiza os anteriores
const Stage = memo(function Stage({ index }) {
  return STAGES[index].map((Part, i) => <Part key={i} />);
});

// Monta a cena; no frameloop "demand" qualquer mudança da store pede um frame
export default function World({ onReady }) {
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

  // Monta um grupo por vez, cada um numa tarefa curta (a cena inteira de uma vez travava a
  // thread ~600ms num celular); por último compila os shaders de tudo
  const [mounted, setMounted] = useState(1);
  useEffect(() => {
    if (mounted >= STAGES.length) return undefined;
    const id = setTimeout(() => setMounted((n) => n + 1), 0);
    return () => clearTimeout(id);
  }, [mounted]);

  return (
    <>
      {STAGES.slice(0, mounted).map((_, i) => <Stage key={i} index={i} />)}
      {mounted >= STAGES.length ? <ShaderWarmup onReady={onReady} /> : null}
    </>
  );
}
