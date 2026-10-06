'use client';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { journeyStore, useJourney } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { CAMERA_PATH } from './config';
import World from './World';
import { HalfRateFrames, useSceneIdle } from './idleFrames';
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
  // Uma camada cobre a tela inteira (o domínio do 無量空処): a cena para de desenhar
  const covered = useJourney((s) => s.covered);
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
  // Antialias só existe na criação do contexto: trocar de nível com ele recria o canvas
  const contextKey = settings.antialias ? 'aa' : 'plain';

  // Nenhum quadro antes da cena montar e os shaders compilarem (ver World e ShaderWarmup); um contexto novo recompila
  const [compiledKey, setCompiledKey] = useState(null);
  const onCompiled = useCallback(() => {
    performance.mark('scene-ready');
    setCompiledKey(contextKey);
    journeyStore.getState().setSceneReady();
  }, [contextKey]);

  // Parada (sem interação há 2s): "demand" a 30 fps em vez de 60 (ver idleFrames)
  const idle = useSceneIdle();
  const halfRate = idle && route !== 'frozen';
  const frameloop = hidden || covered || compiledKey !== contextKey ? 'never' : route === 'frozen' || halfRate ? 'demand' : 'always';

  return (
    <Canvas
      key={contextKey}
      flat
      onCreated={(state) => {
        // ?perf na URL: expõe o renderer para medir programas, draw calls e triângulos
        if (new URLSearchParams(window.location.search).has('perf')) window.__r3f = state;
      }}
      dpr={settings.dpr}
      frameloop={frameloop}
      camera={{ fov: 50, near: 0.1, far: 300, position: CAMERA_PATH[0] }}
      gl={{ antialias: settings.antialias, powerPreference: 'high-performance' }}
    >
      {/* Fora do frameloop "always" os frames chegam em rajadas e o FPS medido não vale */}
      {frameloop === 'always' && warmedUp ? (
        <PerformanceMonitor bounds={FPS_BOUNDS} onDecline={() => journeyStore.getState().downgradeQuality()} />
      ) : null}
      <World onReady={onCompiled} />
      {halfRate && frameloop === 'demand' ? <HalfRateFrames /> : null}
      {settings.postprocessing ? (
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      ) : null}
    </Canvas>
  );
}
