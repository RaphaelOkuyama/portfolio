'use client';
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { journeyStore, useJourney } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { CAMERA_PATH } from './config';
import World from './World';
import Effects from './Effects';
import { trackPointer } from '../../lib/pointer';

// FPS abaixo de 45 durante a amostra (~2,5s) rebaixa a qualidade
const FPS_BOUNDS = () => [45, 1000];

export default function Canvas3D() {
  const quality = useJourney((s) => s.quality);
  const route = useJourney((s) => s.route);
  const [hidden, setHidden] = useState(false);

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
      flat
      onCreated={() => journeyStore.getState().setSceneReady()}
      dpr={settings.dpr}
      frameloop={frameloop}
      camera={{ fov: 50, near: 0.1, far: 300, position: CAMERA_PATH[0] }}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance' }}
    >
      {/* Fora do frameloop "always" os frames chegam em rajadas e o FPS medido não vale */}
      {frameloop === 'always' ? (
        <PerformanceMonitor bounds={FPS_BOUNDS} onDecline={() => journeyStore.getState().downgradeQuality()} />
      ) : null}
      <World />
      <Effects />
    </Canvas>
  );
}
