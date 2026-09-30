'use client';
import { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useJourney } from '../../store/journey';
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

  useEffect(() => {
    setWebgl(hasWebGL());
  }, []);

  if (webgl === false || failed) {
    return (
      <div aria-hidden="true" data-scene="fallback" style={wrapperStyle}>
        <StaticBackdrop theme={theme} mix={mix} />
      </div>
    );
  }

  return (
    <div aria-hidden="true" data-scene="webgl" style={wrapperStyle}>
      {webgl && quality ? (
        <SceneErrorBoundary onError={() => setFailed(true)}>
          <Canvas3D />
        </SceneErrorBoundary>
      ) : null}
    </div>
  );
}
