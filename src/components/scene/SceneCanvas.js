'use client';
import { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { journeyStore, useJourney } from '../../store/journey';
import { hasWebGL } from '../../lib/webgl';
import StaticBackdrop from './StaticBackdrop';

// three/R3F só carregam no cliente, fora do bundle inicial
const Canvas3D = dynamic(() => import('./Canvas3D'), { ssr: false, loading: () => null });

const wrapperStyle = { position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' };

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

  // Só monta a cena 3D quando o navegador fica ocioso: o texto e o loader pintam antes
  // do three.js (parse + shaders) ocupar a thread principal
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    setWebgl(hasWebGL());
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setIdle(true), 200);
    return () => clearTimeout(id);
  }, []);

  // O fundo estático também conta como cena pronta para o loader
  useEffect(() => {
    if (webgl === false || failed) journeyStore.getState().setSceneReady();
  }, [webgl, failed]);

  if (webgl === false || failed) {
    return (
      <div aria-hidden="true" data-scene="fallback" style={wrapperStyle}>
        <StaticBackdrop theme={theme} mix={mix} />
      </div>
    );
  }

  return (
    <div aria-hidden="true" data-scene="webgl" style={wrapperStyle}>
      {webgl && quality && idle ? (
        <SceneErrorBoundary onError={() => setFailed(true)}>
          <Canvas3D />
        </SceneErrorBoundary>
      ) : null}
    </div>
  );
}
