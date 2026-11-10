'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, prepareStroke, strokeOffset, useGSAP } from '../lib/gsapCore';
import { journeyStore, useJourney } from '../store/journey';
import { loaderProgress, isReturningVisit, markVisited, waitsScene, SCENE_WAIT_MAX_MS, CINEMATIC_QUERY } from '../lib/loader';
import { ensoShapes } from '../lib/enso';
import { SHODO_STROKES } from '../lib/shodo';
import Lang from './Lang';

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

// Abertura completa (primeira visita num desktop): o fundo de tinta cobre a página, o ensō escreve
// 奥山 e a íris de nanquim abre sobre a montanha. O CSS usa a mesma consulta (globals.css)
const CINEMATIC = CINEMATIC_QUERY;
// O que sai do desfoque na abertura. Sem opacidade nem recorte: o nome é o LCP e já está pintado
// (sob o fundo de tinta) desde o primeiro quadro
const HERO_LINES = '.hero-name-jp, .hero-title, .hero-roles, .hero-summary, .hero-actions, .hero-available, .hero-okuyama';
const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
const TAU = Math.PI * 2;

// Íris de nanquim: o fundo cobre a tela e um buraco de borda irregular (como tinta recuando no
// papel) cresce do centro. Três camadas com transparência fazem a borda esfumada
function irisPainter(canvas) {
  const ctx = canvas.getContext('2d');
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim() || '#0f1626';
  const cx = w / 2;
  const cy = h / 2;
  return {
    reach: Math.hypot(w, h) * 0.62,
    draw(r) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      if (r <= 0) return;
      const phase = r * 0.006;
      ctx.globalCompositeOperation = 'destination-out';
      [[1.14, 0.22], [1.06, 0.5], [1, 1]].forEach(([k, alpha]) => {
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (let i = 0; i <= 120; i += 1) {
          const th = (i / 120) * TAU;
          const rr = r * k * (1 + 0.05 * Math.sin(3 * th + phase) + 0.028 * Math.sin(7 * th - phase * 1.7) + 0.014 * Math.sin(17 * th + phase * 2.3));
          const x = cx + Math.cos(th) * rr;
          const y = cy + Math.sin(th) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
  };
}

export default function EnsoLoader() {
  const loaderDone = useJourney((s) => s.loaderDone);
  const introDone = useJourney((s) => s.introDone);
  const waiting = useJourney((s) => s.holdScroll && !s.sceneReady);
  const pathname = usePathname();
  const rootRef = useRef(null);
  // Ensō pulado com a cena compilando: um aviso discreto explica por que a home ainda não rola
  // (ver SmoothScroll)
  const [waitOver, setWaitOver] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setWaitOver(true), SCENE_WAIT_MAX_MS);
    return () => clearTimeout(id);
  }, []);
  const pathRef = useRef(null);
  const markRef = useRef(null);
  const irisRef = useRef(null);

  useGSAP(() => {
    if (loaderDone) return undefined;
    const store = journeyStore.getState();
    // Visita de volta: o CSS já escondeu o overlay no primeiro paint; libera a página na hora
    if (isReturningVisit()) {
      store.setLoaderDone();
      store.setIntroDone();
      return undefined;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cinematic = window.matchMedia(CINEMATIC).matches;
    const path = pathRef.current;
    const start = performance.now();
    let shown = 0;
    let finished = false;
    let skipped = false;
    let timeline = null;
    let breathing = null;

    // Clique, tecla ou rolagem pulam: o traço fecha e a abertura corre quatro vezes mais rápido
    const skip = () => {
      skipped = true;
      timeline?.timeScale(4);
    };
    SKIP_EVENTS.forEach((type) => window.addEventListener(type, skip, { passive: true }));
    const stopListening = () => SKIP_EVENTS.forEach((type) => window.removeEventListener(type, skip));

    // Fora da home não há hero nem pôster: as listas ficam vazias e as animações não fazem nada
    const heroLines = gsap.utils.toArray(document.querySelectorAll(HERO_LINES));
    const poster = gsap.utils.toArray(document.querySelectorAll('.scene-poster-frame'));
    // A hero espera desfocada sob o fundo de tinta (só na abertura completa)
    if (cinematic && heroLines.length) gsap.set(heroLines, { filter: 'blur(14px)', y: 22 });

    // O traço é "desenhado" deslocando o tracejado (núcleo do GSAP, sem o plugin DrawSVG)
    prepareStroke(path);
    gsap.set(path, { strokeDashoffset: strokeOffset(path, 0), visibility: 'visible' });

    // O pincel escreve 奥 e depois 山, na ordem dos traços
    // (escondido no HTML do servidor: sem isso os traços apareceriam prontos e sumiriam)
    const strokes = rootRef.current.querySelectorAll('[data-shodo-stroke]');
    strokes.forEach((s) => prepareStroke(s));
    gsap.set(strokes, { strokeDashoffset: (i, el) => strokeOffset(el, reduced ? 1 : 0) });
    gsap.set(rootRef.current.querySelector('[data-shodo]'), { visibility: 'visible' });
    if (!reduced) {
      gsap.to(strokes, {
        strokeDashoffset: 0, duration: STROKE_SECONDS, ease: 'power1.in', stagger: STROKE_SECONDS * 1.1, delay: 0.15,
      });
    }

    // O ensō saiu (pulado) com a cena ainda compilando: a home segura a rolagem até ela ficar
    // pronta (ver SmoothScroll). Só a que já carregava agora: a que começar depois, por um clique,
    // não prende a navegação que esse clique pediu
    const release = () => {
      const now = journeyStore.getState();
      if (!now.loaderDone && cinematic && window.location.pathname === '/') {
        journeyStore.setState({ holdScroll: waitsScene(now) && !now.sceneReady });
      }
      store.setLoaderDone();
    };

    const finish = () => {
      markVisited();
      stopListening();
      release();
      store.setIntroDone();
    };

    // Abertura completa: a íris abre, o ensō cresce e some (a câmera passa por ele), o pôster da
    // cena aproxima como a câmera descendo até o torii e a hero sai do desfoque, linha por linha
    const openIris = (tl) => {
      const painter = irisPainter(irisRef.current);
      const iris = { r: 0 };
      tl.add(() => {
        painter.draw(0);
        rootRef.current.setAttribute('data-iris', '');
      }, '+=0.12')
        .to(iris, { r: painter.reach, duration: 1.35, ease: 'power3.inOut', onUpdate: () => painter.draw(iris.r) }, '<')
        .to(markRef.current, { scale: 2.6, opacity: 0, duration: 0.9, ease: 'power2.in' }, '<')
        .to(rootRef.current.querySelector('.enso-skip'), { opacity: 0, duration: 0.3 }, '<')
        // A página volta a rolar e a hero começa a se mexer com a íris pela metade
        .add(release, '<0.55')
        .fromTo(poster, { scale: 1.16, yPercent: -3 }, { scale: 1, yPercent: 0, duration: 2.6, ease: 'power2.out' }, '<-0.4')
        .to(heroLines, { filter: 'blur(0px)', y: 0, duration: 1.25, ease: 'power3.out', stagger: 0.08, clearProps: 'filter,transform' }, '<0.25');
    };

    const tick = () => {
      if (finished) return;
      const progress = skipped ? 1 : loaderProgress({
        elapsed: performance.now() - start,
        // performance.now() começa na navegação
        waited: performance.now(),
        // Na abertura completa espera a cena 3D compilar: abrir a íris antes travava a tela vazia
        // no meio. No celular (sem íris) a cena começa depois, no primeiro toque, e sem placa de
        // vídeo (cena leve, compilada na CPU) a espera seria longa: nesses casos fecha no traço
        // Só espera a cena que já começou: sem placa de vídeo boa ela é adiada de propósito (ver
        // SceneCanvas) e o pôster segura a abertura
        sceneReady: !cinematic || !waitsScene(journeyStore.getState()) || journeyStore.getState().sceneReady,
        ...(reduced ? { minMs: 0 } : {}),
      });

      if (progress < 1) {
        // Traço a 90%, esperando a cena: o ensō respira devagar, para a tela não parecer parada
        if (progress >= 0.9 && !breathing && !reduced) {
          breathing = gsap.to(markRef.current, { scale: 1.045, opacity: 0.82, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        }
        if (progress - shown >= MIN_STEP) {
          shown = progress;
          gsap.to(path, { strokeDashoffset: strokeOffset(path, progress), duration: 0.3, ease: 'power1.out', overwrite: true });
        }
        return;
      }

      // Fecha o círculo; depois a íris (desktop) ou só o fade do overlay
      finished = true;
      gsap.ticker.remove(tick);
      breathing?.kill();
      if (breathing) gsap.set(markRef.current, { scale: 1, opacity: 1 });
      timeline = gsap
        .timeline({ onComplete: finish })
        .to(path, { strokeDashoffset: 0, duration: reduced ? 0 : 0.35, ease: 'power2.out', overwrite: true })
        // Num aparelho lento o ensō pode fechar antes do pincel: 奥山 termina de ser escrito antes de sumir
        .to(strokes, { strokeDashoffset: 0, duration: reduced ? 0 : 0.25, ease: 'power1.out', overwrite: true }, '<');
      if (cinematic) {
        openIris(timeline);
      } else {
        timeline
          .to(rootRef.current, { opacity: 0, duration: reduced ? 0 : 0.6, ease: 'power2.inOut' })
          .add(release);
        // No celular o pôster só assenta (a íris fica para telas grandes com mouse)
        if (!reduced && poster.length) timeline.fromTo(poster, { scale: 1.07 }, { scale: 1, duration: 1.8, ease: 'power2.out' }, '<-0.4');
      }
      if (skipped) timeline.timeScale(4);
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      breathing?.kill();
      stopListening();
    };
  }, { dependencies: [loaderDone] });

  if (loaderDone && introDone) {
    // A pessoa pulou o ensō antes de a cena ficar pronta: a home não rola até ela chegar
    if (pathname === '/' && waiting && !waitOver) {
      return (
        <p className="enso-wait" role="status">
          <span className="enso-wait-dot" aria-hidden="true" />
          <Lang pt="Preparando a montanha…" en="Preparing the mountain…" />
        </p>
      );
    }
    return null;
  }

  return (
    <div ref={rootRef} data-loader="enso" aria-hidden="true">
      {/* Sem JavaScript o loader nunca terminaria: esconde */}
      <noscript>
        <style>{'[data-loader="enso"]{display:none}'}</style>
      </noscript>
      <canvas ref={irisRef} className="enso-iris" />
      <svg ref={markRef} className="enso-mark" viewBox="0 0 220 220" width="200" height="200">
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
      <p className="enso-skip"><Lang pt="Clique para pular" en="Click to skip" /></p>
    </div>
  );
}
