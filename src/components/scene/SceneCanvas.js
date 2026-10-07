'use client';
import { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { journeyStore, useJourney } from '../../store/journey';
import { hasWebGL } from '../../lib/webgl';
import StaticBackdrop from './StaticBackdrop';

// three/R3F só carregam no cliente, fora do bundle inicial
const loadCanvas = () => import('./Canvas3D');
const Canvas3D = dynamic(loadCanvas, { ssr: false, loading: () => null });

const wrapperStyle = { position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' };

// A cena 3D (three.js ~240 KB, geometrias e shaders) é o trabalho mais pesado da página: feita no
// carregamento, segurava a thread por segundos num celular. Agora a página abre com o cenário
// pintado (StaticBackdrop: as mesmas montanhas, céu e rio) e a cena 3D só começa quando a pessoa
// interage (mexe o mouse, rola, toca, tecla) ou, se ninguém interagir, um pouco depois do
// carregamento terminar. Ela entra num fade por cima do fundo estático
const START_EVENTS = ['pointermove', 'pointerdown', 'wheel', 'scroll', 'touchstart', 'keydown'];
// Sem interação, a cena começa este tempo depois do carregamento (a pessoa só lendo a hero)
export const SCENE_AUTOSTART_MS = 8000;

function useSceneStart(enabled) {
  const [start, setStart] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    let timer = 0;
    let idleId = 0;
    const go = () => {
      cleanup();
      performance.mark('scene-start');
      setStart(true);
    };
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1));
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
    const afterLoad = () => {
      timer = setTimeout(() => { idleId = idle(go, { timeout: 2000 }); }, SCENE_AUTOSTART_MS);
    };
    const cleanup = () => {
      START_EVENTS.forEach((type) => window.removeEventListener(type, go));
      window.removeEventListener('load', afterLoad);
      clearTimeout(timer);
      cancelIdle(idleId);
    };
    START_EVENTS.forEach((type) => window.addEventListener(type, go, { passive: true, once: true }));
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
    return cleanup;
  }, [enabled]);
  return start;
}

// Se o chunk falhar ou o renderer lançar erro, avisa o pai para trocar pelo fundo estático
class SceneErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SceneCanvas() {
  const [webgl, setWebgl] = useState(null);
  const [failed, setFailed] = useState(false);
  const quality = useJourney((s) => s.quality);
  const theme = useJourney((s) => s.theme);
  const mix = useJourney((s) => Math.round(s.seasonMix));
  const sceneReady = useJourney((s) => s.sceneReady);
  // Depois do fade da cena, o fundo estático sai do DOM (não fica pintando por baixo)
  const [backdropGone, setBackdropGone] = useState(false);

  // O teste de WebGL cria um contexto de GPU: feito no carregamento, segurava a primeira pintura
  // (o quadro esperava o processo da GPU acordar). Agora só acontece quando a cena vai começar;
  // até lá o cenário pintado já está na tela
  const start = useSceneStart(!failed);
  useEffect(() => {
    if (start && webgl === null) setWebgl(hasWebGL());
  }, [start, webgl]);

  // Sem WebGL (ou se a cena falhar), o fundo estático é a cena
  useEffect(() => {
    if (webgl === false || failed) journeyStore.getState().setSceneReady();
  }, [webgl, failed]);

  useEffect(() => {
    if (!sceneReady || webgl !== true || failed) return undefined;
    const id = setTimeout(() => setBackdropGone(true), 1200);
    return () => clearTimeout(id);
  }, [sceneReady, webgl, failed]);

  if (webgl === false || failed) {
    return (
      <div aria-hidden="true" data-scene="fallback" style={wrapperStyle}>
        <StaticBackdrop theme={theme} mix={mix} />
        <div className="washi" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" data-scene="webgl" style={wrapperStyle}>
      {/* Até a cena 3D chegar: o mesmo cenário, pintado (some depois do fade da cena) */}
      {backdropGone ? null : <StaticBackdrop theme={theme} mix={mix} />}
      {webgl && quality && start ? (
        <SceneErrorBoundary onError={() => setFailed(true)}>
          {/* A cena entra num fade por cima do fundo estático, sem estalo */}
          <div style={{ position: 'absolute', inset: 0, opacity: sceneReady ? 1 : 0, transition: 'opacity 0.9s ease' }}>
            <Canvas3D />
          </div>
        </SceneErrorBoundary>
      ) : null}
      {/* Papel washi estático + vinheta por cima da cena (abaixo do conteúdo) */}
      <div className="washi" />
    </div>
  );
}
