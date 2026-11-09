'use client';
import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import GalleryLightbox from './projects/GalleryLightbox';
import { gsap, useGSAP } from '../lib/gsap';

/**
 * Galeria do projeto. Recebe [{ src, alt, fit? }]: fit 'contain' mostra a foto inteira sobre
 * branco (as peças da Saeko); o resto preenche o quadro. `isMobile`: telas de celular numa moldura.
 *
 * Todas as fotos ficam empilhadas no quadro e a atual e as vizinhas já estão montadas (carregadas
 * antes do clique). A troca move juntas a que sai e a que entra, como uma tira, com a imagem
 * andando um pouco menos que o quadro (paralaxe). Antes o src mudava no meio da animação: a foto
 * antiga voltava deslizando e só depois virava a nova. Clicar de novo no meio da troca continua o
 * movimento de onde ele está, sem travar nem pular.
 */
const DURATION = 0.75;
const EASE = 'power4.out';
const PARALLAX = 38; // % que a imagem anda ao contrário do quadro
const SWIPE = 40; // px de arrasto para trocar de foto
// A que entra cobre ~2 px da que sai: lado a lado exato, o subpixel deixava um fio do fundo escuro
// na emenda durante a troca
const OVERLAP = 0.3;

const DEFAULT_LABELS = {
  prev: 'Foto anterior', next: 'Próxima foto', goTo: 'Ir para a foto {n}',
  open: 'Ver em tela cheia', close: 'Fechar', zoom: 'Clique na imagem para ampliar',
};

const around = (i, n) => [i, (i + 1) % n, (i - 1 + n) % n];

export default function ProjectImageCarousel({ images = [], isMobile = false, labels }) {
  const text = { ...DEFAULT_LABELS };
  for (const [key, value] of Object.entries(labels ?? {})) if (value) text[key] = value;
  const count = images.length;
  const [current, setCurrent] = useState(0);
  const [mounted, setMounted] = useState(() => new Set(around(0, count)));
  const currentRef = useRef(0);
  const slides = useRef([]);
  const media = useRef([]);
  const pointer = useRef(null);
  const { contextSafe } = useGSAP();
  const [full, setFull] = useState(false);

  const goTo = contextSafe((next, dir) => {
    const from = currentRef.current;
    if (next === from || count < 2) return;
    currentRef.current = next;
    setCurrent(next);
    setMounted((prev) => {
      const add = around(next, count).filter((i) => !prev.has(i));
      return add.length ? new Set([...prev, ...add]) : prev;
    });

    const out = slides.current[from];
    const inn = slides.current[next];
    const outMedia = media.current[from];
    const inMedia = media.current[next];
    if (!out || !inn) return;
    // A que entra estava em cena (troca interrompida)? Continua de onde está
    const inFlight = inn.style.visibility === 'visible';
    gsap.killTweensOf([out, inn, outMedia, inMedia]);
    const settle = (el) => () => gsap.set(el, { clearProps: 'visibility,zIndex,transform,opacity' });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set([out, outMedia, inMedia], { clearProps: 'transform' });
      gsap.set(out, { visibility: 'visible', zIndex: 1 });
      gsap.set(inn, { visibility: 'visible', zIndex: 2, xPercent: 0 });
      gsap.fromTo(inn, { opacity: inFlight ? Number(gsap.getProperty(inn, 'opacity')) : 0 }, { opacity: 1, duration: 0.25, ease: 'none', onComplete: settle(inn) });
      gsap.to(out, { duration: 0.25, onComplete: settle(out) });
      return;
    }

    const start = Number(gsap.getProperty(out, 'xPercent')) || 0;
    gsap.set(out, { visibility: 'visible', zIndex: 1 });
    gsap.set(inn, { visibility: 'visible', zIndex: 2, opacity: 1 });
    if (!inFlight) {
      gsap.set(inn, { xPercent: start + (100 - OVERLAP) * dir });
      gsap.set(inMedia, { xPercent: -PARALLAX * dir });
    }
    // As duas andam a mesma distância: a sobreposição fica constante até o fim (no fim, o resto da
    // que saiu está embaixo da que entrou)
    gsap.to(out, { xPercent: -(100 - OVERLAP) * dir, duration: DURATION, ease: EASE, onComplete: settle(out) });
    gsap.to(outMedia, { xPercent: PARALLAX * dir, duration: DURATION, ease: EASE, onComplete: settle(outMedia) });
    gsap.to(inn, { xPercent: 0, duration: DURATION, ease: EASE, onComplete: settle(inn) });
    gsap.to(inMedia, { xPercent: 0, duration: DURATION, ease: EASE, onComplete: settle(inMedia) });
  });

  // Fechou a tela cheia: o carrossel fica na foto em que a pessoa parou
  const closeFull = useCallback((at) => {
    setFull(false);
    if (at !== currentRef.current) goTo(at, at > currentRef.current ? 1 : -1);
  }, [goTo]);

  if (!count) return null;

  const go = (dir) => goTo((currentRef.current + dir + count) % count, dir);
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };
  // Arrastar para o lado (toque ou mouse) troca a foto; na vertical a página rola normalmente
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointer.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - start.y) * 1.2) go(dx < 0 ? 1 : -1);
  };
  const cancelPointer = () => { pointer.current = null; };

  const several = count > 1;
  const frame = (
    <div
      className={`pic-frame${isMobile ? ' is-screen' : ''}`}
      onPointerDown={several ? onPointerDown : undefined}
      onPointerUp={several ? onPointerUp : undefined}
      onPointerCancel={several ? cancelPointer : undefined}
    >
      {images.map((img, i) => (
        <div
          key={img.src}
          ref={(el) => { slides.current[i] = el; }}
          className={`pic-slide${i === current ? ' is-current' : ''}${img.fit === 'contain' ? ' is-contain' : ''}`}
          aria-hidden={i !== current}
        >
          <div ref={(el) => { media.current[i] = el; }} className="pic-media">
            {mounted.has(i) ? (
              <Image
                src={img.src}
                alt={img.alt || `${i + 1}`}
                fill
                draggable={false}
                sizes={isMobile ? '240px' : '(max-width: 900px) 100vw, 900px'}
                style={{ objectFit: isMobile || img.fit !== 'contain' ? 'cover' : 'contain', objectPosition: isMobile ? 'top' : 'center' }}
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
  const arrows = several ? (
    <>
      <button type="button" className="pic-arrow is-prev" onClick={() => go(-1)} aria-label={text.prev}>
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <button type="button" className="pic-arrow is-next" onClick={() => go(1)} aria-label={text.next}>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </>
  ) : null;
  const dots = several ? (
    <div className="pic-dots">
      {images.map((img, i) => (
        <button
          key={img.src}
          type="button"
          className="pic-dot"
          onClick={() => goTo(i, i > currentRef.current ? 1 : -1)}
          aria-label={text.goTo.replace('{n}', i + 1)}
          aria-current={i === current ? 'true' : undefined}
        />
      ))}
    </div>
  ) : null;
  const expand = (
    <button type="button" className="pic-expand" onClick={() => setFull(true)} aria-label={text.open} title={text.open}>
      <Maximize2 size={17} aria-hidden="true" />
    </button>
  );
  const lightbox = (
    <GalleryLightbox
      images={images}
      open={full}
      start={current}
      onClose={closeFull}
      isMobile={isMobile}
      labels={{ open: text.open, close: text.close, zoom: text.zoom, prev: text.prev, next: text.next }}
    />
  );
  const caption = (
    <p className="pic-caption" aria-live="polite">
      <span>{images[current].alt}</span>
      {several ? <span className="pic-count">{current + 1} / {count}</span> : null}
    </p>
  );

  // Telas de celular: moldura do aparelho, setas dos lados e os pontos embaixo
  if (isMobile) {
    return (
      <div className="pic is-phone" onKeyDown={onKeyDown}>
        <div className="pic-phone">
          <span className="pic-notch" aria-hidden="true" />
          {frame}
          {arrows}
          {expand}
        </div>
        {caption}
        {dots}
        {lightbox}
      </div>
    );
  }

  return (
    <div className="pic" onKeyDown={onKeyDown}>
      <div className="pic-stage">
        {frame}
        {arrows}
        {dots}
        {expand}
      </div>
      {caption}
      {lightbox}
    </div>
  );
}
