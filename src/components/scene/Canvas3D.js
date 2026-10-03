'use client';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { journeyStore, useJourney } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { CAMERA_PATH } from './config';
import World from './World';
// Pós-processamento só é baixado quando a qualidade alta pede
const Effects = lazy(() => import('./Effects'));
import { trackPointer } from '../../lib/pointer';

// FPS abaixo de 45 durante a amostra (~2,5s) rebaixa a qualidade
const FPS_BOUNDS = () => [45, 1000];
// Só mede depois que a cena assentou: no começo a compilação de shaders e o download
// dos chunks derrubam o FPS e rebaixariam a qualidade (sumindo o bloom) sem motivo
const MONITOR_WARMUP_MS = 4000;

export default function Canvas3D() {
  const quality = useJourney((s) => s.quality);
  const route = useJourney((s) => s.route);
  const loaderDone = useJourney((s) => s.loaderDone);
  const [hidden, setHidden] = useState(false);
  const [warmedUp, setWarmedUp] = useState(false);

  useEffect(() => {
    if (!loaderDone) return undefined;
    const id = setTimeout(() => setWarmedUp(true), MONITOR_WARMUP_MS);
    return () => clearTimeout(id);
  }, [loaderDone]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => trackPointer(), []);

  const settings = QUALITY_SETTINGS[quality];
  const frameloop = hidden ? 'never' : route === 'frozen' ? 'demand' : 'always';

  return (
    <Canvas
      // Antialias só existe na criação do contexto: trocar de nível com ele recria o canvas
      key={settings.antialias ? 'aa' : 'plain'}
      flat
      onCreated={() => journeyStore.getState().setSceneReady()}
      dpr={settings.dpr}
      frameloop={frameloop}
      camera={{ fov: 50, near: 0.1, far: 300, position: CAMERA_PATH[0] }}
      gl={{ antialias: settings.antialias, powerPreference: 'high-performance' }}
    >
      {/* Fora do frameloop "always" os frames chegam em rajadas e o FPS medido não vale */}
      {frameloop === 'always' && warmedUp ? (
        <PerformanceMonitor bounds={FPS_BOUNDS} onDecline={() => journeyStore.getState().downgradeQuality()} />
      ) : null}
      <World />
      {settings.postprocessing ? (
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      ) : null}
    </Canvas>
  );
}
