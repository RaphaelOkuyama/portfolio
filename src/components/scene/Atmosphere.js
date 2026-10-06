'use client';
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Fog } from 'three';
import { journeyStore } from '../../store/journey';
import { SEASONS } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { SUNSET, startSkyTransition, sunsetGlow, transitionPhase } from '../../lib/journey/skyTransition';
import { FOG_RANGE, LOST_FOG } from './config';

const now = () => performance.now() / 1000;

// Céu e névoa seguem estação e tema, com transição suave. Na troca de tema o céu passa pelo pôr
// (ou nascer) do sol: laranja no horizonte, roxo no alto (ver skyTransition)
export default function Atmosphere() {
  const scene = useThree((s) => s.scene);
  // Cores de base (amortecidas) e as que vão para a cena (base + tingido do pôr do sol)
  const base = useMemo(() => ({ sky: new Color(), fog: new Color() }), []);
  const sky = useMemo(() => new Color(), []);
  const fog = useMemo(() => new Fog('#000000', FOG_RANGE[0], FOG_RANGE[1]), []);
  const target = useMemo(() => ({ sky: new Color(), fog: new Color() }), []);
  const sunset = useMemo(() => ({ horizon: new Color(SUNSET.horizon), zenith: new Color(SUNSET.zenith) }), []);

  useEffect(() => {
    const { theme, seasonMix } = journeyStore.getState();
    const season = sampleSeason(SEASONS[theme], seasonMix);
    base.sky.set(season.sky);
    base.fog.set(season.fog);
    sky.copy(base.sky);
    fog.color.copy(base.fog);
    scene.background = sky;
    scene.fog = fog;
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, sky, fog, base]);

  // Troca de tema: começa o pôr (ou nascer) do sol. Com movimento reduzido a troca é direta
  useEffect(() => journeyStore.subscribe((state, prev) => {
    if (state.theme !== prev.theme && !state.reducedMotion) startSkyTransition(prev.theme, state.theme, now());
  }), []);

  useFrame((state, delta) => {
    const { theme, seasonMix, lost } = journeyStore.getState();
    const season = sampleSeason(SEASONS[theme], seasonMix);
    target.sky.set(season.sky);
    target.fog.set(season.fog);
    // 迷子 (404): o céu some na névoa e ela fecha bem perto da câmera
    if (lost) target.sky.lerp(target.fog, LOST_FOG.skyMix);
    const [near, far] = lost ? LOST_FOG.range : FOG_RANGE;
    const k = 1 - Math.exp(-delta * 4);
    base.sky.lerp(target.sky, k);
    base.fog.lerp(target.fog, k);
    fog.near += (near - fog.near) * k;
    fog.far += (far - fog.far) * k;

    // Pôr do sol por cima das cores de base, no auge no meio da transição
    const glow = sunsetGlow(transitionPhase(now()));
    sky.copy(base.sky).lerp(sunset.zenith, glow * SUNSET.amount.zenith);
    fog.color.copy(base.fog).lerp(sunset.horizon, glow * SUNSET.amount.horizon);

    // No frameloop "demand" continua pedindo frames até convergir (e durante o pôr do sol)
    const skyDelta = Math.abs(base.sky.r - target.sky.r) + Math.abs(base.sky.g - target.sky.g) + Math.abs(base.sky.b - target.sky.b);
    if (glow > 0 || skyDelta > 0.002 || Math.abs(fog.far - far) > 0.05) state.invalidate();
  });

  return null;
}
