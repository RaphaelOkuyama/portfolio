'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useJourney } from '../../store/journey';
import { hasWebGL } from '../../lib/webgl';
import StaticBackdrop from './StaticBackdrop';

// three/R3F só carregam no cliente, fora do bundle inicial
const Canvas3D = dynamic(() => import('./Canvas3D'), { ssr: false, loading: () => null });

const wrapperStyle = { position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' };

export default function SceneCanvas() {
  const [webgl, setWebgl] = useState(null);
  const quality = useJourney((s) => s.quality);
  const theme = useJourney((s) => s.theme);

  useEffect(() => {
    setWebgl(hasWebGL());
  }, []);

  if (webgl === false) {
    return (
      <div aria-hidden="true" data-scene="fallback" style={wrapperStyle}>
        <StaticBackdrop theme={theme} />
      </div>
    );
  }

  return (
    <div aria-hidden="true" data-scene="webgl" style={wrapperStyle}>
      {webgl && quality ? <Canvas3D /> : null}
    </div>
  );
}
