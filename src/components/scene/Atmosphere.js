'use client';
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Fog } from 'three';
import { journeyStore } from '../../store/journey';
import { SEASONS } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { FOG_RANGE } from './config';

// Céu e névoa seguem estação e tema, com transição suave
export default function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const sky = useMemo(() => new Color(), []);
  const fog = useMemo(() => new Fog('#000000', FOG_RANGE[0], FOG_RANGE[1]), []);
  const target = useMemo(() => ({ sky: new Color(), fog: new Color() }), []);

  useEffect(() => {
    const { theme, seasonMix } = journeyStore.getState();
    const season = sampleSeason(SEASONS[theme], seasonMix);
    sky.set(season.sky);
    fog.color.set(season.fog);
    scene.background = sky;
    scene.fog = fog;
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, sky, fog]);

  useFrame((state, delta) => {
    const { theme, seasonMix } = journeyStore.getState();
    const season = sampleSeason(SEASONS[theme], seasonMix);
    target.sky.set(season.sky);
    target.fog.set(season.fog);
    const k = 1 - Math.exp(-delta * 4);
    sky.lerp(target.sky, k);
    fog.color.lerp(target.fog, k);
    // No frameloop "demand" continua pedindo frames até convergir
    if (Math.abs(sky.r - target.sky.r) + Math.abs(sky.g - target.sky.g) + Math.abs(sky.b - target.sky.b) > 0.002) {
      state.invalidate();
    }
  });

  return null;
}
