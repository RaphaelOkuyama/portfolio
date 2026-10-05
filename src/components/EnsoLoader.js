'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { journeyStore, useJourney } from '../store/journey';
import { loaderProgress, isReturningVisit, markVisited } from '../lib/loader';
import { ensoShapes } from '../lib/enso';
import { SHODO_STROKES } from '../lib/shodo';

// Ensō de pincel: corpo de tinta + cerdas, revelados por uma máscara que segue o traço
const SHAPES = ensoShapes();

// Só redesenha quando o progresso anda pelo menos 1%
const MIN_STEP = 0.01;

// 書道: 奥山 escrito traço a traço no meio do ensō (grade de 109 do KanjiVG, ~37px por kanji)
const SHODO_SCALE = 0.34;
const SHODO_LAYOUT = [
  { char: '奥', x: 72, y: 91 },
  { char: '山', x: 111, y: 91 },
];
// Cada traço leva um instante; o kanji inteiro cabe no tempo mínimo do loader
const STROKE_SECONDS = 0.07;

export default function EnsoLoader() {
  const loaderDone = useJourney((s) => s.loaderDone);
  const rootRef = useRef(null);
  const pathRef = useRef(null);

  useGSAP(() => {
    if (loaderDone) return undefined;
    // Visita de volta: o CSS já escondeu o overlay no primeiro paint; libera a página na hora
    if (isReturningVisit()) {
      journeyStore.getState().setLoaderDone();
      return undefined;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const path = pathRef.current;
    const start = performance.now();
    let shown = 0;
    let finished = false;

    gsap.set(path, { drawSVG: '0%', visibility: 'visible' });

    // O pincel escreve 奥 e depois 山, na ordem dos traços
    // (escondido no HTML do servidor: sem isso os traços apareceriam prontos e sumiriam)
    const strokes = rootRef.current.querySelectorAll('[data-shodo-stroke]');
    gsap.set(strokes, { drawSVG: reduced ? '100%' : '0%' });
    gsap.set(rootRef.current.querySelector('[data-shodo]'), { visibility: 'visible' });
    if (!reduced) {
      gsap.to(strokes, {
        drawSVG: '100%', duration: STROKE_SECONDS, ease: 'power1.in', stagger: STROKE_SECONDS * 1.1, delay: 0.15,
      });
    }

    const tick = () => {
      if (finished) return;
      const progress = loaderProgress({
        elapsed: performance.now() - start,
        // performance.now() começa na navegação
        waited: performance.now(),
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
        .timeline({
          onComplete: () => {
            markVisited();
            journeyStore.getState().setLoaderDone();
          },
        })
        .to(path, { drawSVG: '100%', duration: reduced ? 0 : 0.35, ease: 'power2.out', overwrite: true })
        // Num aparelho lento o ensō pode fechar antes do pincel: 奥山 termina de ser escrito antes de sumir
        .to(strokes, { drawSVG: '100%', duration: reduced ? 0 : 0.25, ease: 'power1.out', overwrite: true }, '<')
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
      <svg viewBox="0 0 220 220" width="200" height="200">
        <defs>
          <mask id="enso-brush" maskUnits="userSpaceOnUse" x="0" y="0" width="220" height="220">
            {/* DrawSVG anima este guia: onde ele passa, a tinta aparece */}
            <path
              ref={pathRef}
              d={SHAPES.guide}
              style={{ visibility: 'hidden' }}
              fill="none"
              stroke="#fff"
              strokeWidth={SHAPES.guideWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>
        <g mask="url(#enso-brush)" data-enso-brush="">
          <path d={SHAPES.core} fill="var(--ink)" />
          <g fill="none" stroke="var(--ink)" strokeLinecap="round" strokeLinejoin="round">
            {SHAPES.bristles.map((b, i) => (
              <path key={i} d={b.d} strokeWidth={b.width} strokeOpacity={b.opacity} />
            ))}
          </g>
          <g fill="none" stroke="var(--bg-color)" strokeLinecap="round">
            {SHAPES.scratches.map((s, i) => (
              <path key={i} d={s.d} strokeWidth={s.width} strokeOpacity={s.opacity} />
            ))}
          </g>
        </g>
        <g data-shodo="" style={{ visibility: 'hidden' }} fill="none" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
          {SHODO_LAYOUT.map(({ char, x, y }) => (
            <g key={char} transform={`translate(${x} ${y}) scale(${SHODO_SCALE})`}>
              {SHODO_STROKES[char].map((d, i) => (
                <path key={i} d={d} data-shodo-stroke="" />
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
