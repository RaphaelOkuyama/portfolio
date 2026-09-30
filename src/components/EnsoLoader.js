'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { journeyStore, useJourney } from '../store/journey';
import { loaderProgress } from '../lib/loader';

// Traço de pincel quase fechado (ensō), começando embaixo à esquerda
const ENSO_PATH = 'M 62 150 C 30 118 34 58 86 38 C 138 18 186 52 184 104 C 182 150 140 180 98 172';

// Só redesenha quando o progresso anda pelo menos 1%
const MIN_STEP = 0.01;

export default function EnsoLoader() {
  const loaderDone = useJourney((s) => s.loaderDone);
  const rootRef = useRef(null);
  const pathRef = useRef(null);

  useGSAP(() => {
    if (loaderDone) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const path = pathRef.current;
    const start = performance.now();
    let shown = 0;
    let finished = false;

    gsap.set(path, { drawSVG: '0%' });

    const tick = () => {
      if (finished) return;
      const progress = loaderProgress({
        elapsed: performance.now() - start,
        sceneReady: journeyStore.getState().sceneReady,
        ...(reduced ? { minMs: 0 } : {}),
      });

      if (progress < 1) {
        if (progress - shown >= MIN_STEP) {
          shown = progress;
          gsap.to(path, { drawSVG: `${progress * 100}%`, duration: 0.3, ease: 'power1.out', overwrite: true });
        }
        return;
      }

      // Fecha o círculo e dissolve o overlay
      finished = true;
      gsap.ticker.remove(tick);
      gsap
        .timeline({ onComplete: () => journeyStore.getState().setLoaderDone() })
        .to(path, { drawSVG: '100%', duration: reduced ? 0 : 0.35, ease: 'power2.out', overwrite: true })
        .to(rootRef.current, { opacity: 0, duration: reduced ? 0 : 0.6, ease: 'power2.inOut' });
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, { dependencies: [loaderDone] });

  if (loaderDone) return null;

  return (
    <div
      ref={rootRef}
      data-loader="enso"
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: 'var(--bg-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Sem JavaScript o loader nunca terminaria: esconde */}
      <noscript>
        <style>{'[data-loader="enso"]{display:none}'}</style>
      </noscript>
      <svg viewBox="0 0 220 220" width="180" height="180">
        <path ref={pathRef} d={ENSO_PATH} fill="none" stroke="var(--ink)" strokeWidth="12" strokeLinecap="round" />
        <text x="110" y="122" textAnchor="middle" fontSize="34" fill="var(--ink)" className="font-jp">
          奥山
        </text>
      </svg>
    </div>
  );
}
