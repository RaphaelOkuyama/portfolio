'use client';
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Fog } from 'three';
import { journeyStore } from '../../store/journey';
import { SEASONS } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { FOG_RANGE, LOST_FOG } from './config';

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
    const { theme, seasonMix, lost } = journeyStore.getState();
    const season = sampleSeason(SEASONS[theme], seasonMix);
    target.sky.set(season.sky);
    target.fog.set(season.fog);
    // 迷子 (404): o céu some na névoa e ela fecha bem perto da câmera
    if (lost) target.sky.lerp(target.fog, LOST_FOG.skyMix);
    const [near, far] = lost ? LOST_FOG.range : FOG_RANGE;
    const k = 1 - Math.exp(-delta * 4);
    sky.lerp(target.sky, k);
    fog.color.lerp(target.fog, k);
    fog.near += (near - fog.near) * k;
    fog.far += (far - fog.far) * k;
    // No frameloop "demand" continua pedindo frames até convergir
    const skyDelta = Math.abs(sky.r - target.sky.r) + Math.abs(sky.g - target.sky.g) + Math.abs(sky.b - target.sky.b);
    if (skyDelta > 0.002 || Math.abs(fog.far - far) > 0.05) state.invalidate();
  });

  return null;
}
