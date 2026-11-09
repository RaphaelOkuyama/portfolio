'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { pauseScroll, resumeScroll } from '../../lib/scroll';

const ZOOM = 2.2;

// A galeria do projeto em tela cheia: a foto no tamanho que a tela permite, setas (botões, teclado
// ou arrasto) e um clique para ampliar no ponto clicado; com a foto ampliada, o mouse passeia
// por ela. <dialog> nativo, como o visualizador dos certificados: Esc, o X ou um clique fora fecham
export default function GalleryLightbox({ images, open, start, onClose, isMobile, labels }) {
  const dialogRef = useRef(null);
  const [index, setIndex] = useState(start);
  const [zoom, setZoom] = useState(null);
  const swipe = useRef(null);
  const count = images.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setIndex(start);
      setZoom(null);
      dialog.showModal();
      pauseScroll();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, start]);

  const indexRef = useRef(index);
  indexRef.current = index;
  useEffect(() => {
    const dialog = dialogRef.current;
    const handle = () => {
      resumeScroll();
      onClose(indexRef.current);
    };
    dialog.addEventListener('close', handle);
    return () => dialog.removeEventListener('close', handle);
  }, [onClose]);

  const go = (step) => {
    if (count < 2) return;
    setZoom(null);
    setIndex((i) => (i + step + count) % count);
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  // Ponto da foto sob o cursor, em %: vira a origem da ampliação
  const point = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const onPointerDown = (e) => { swipe.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    // Arrasto para o lado troca a foto (sem ampliação); um toque parado amplia ou volta
    if (!zoom && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    // O ponto é lido já: dentro do updater do estado o evento não tem mais currentTarget
    if (Math.hypot(dx, e.clientY - s.y) < 8) {
      const at = point(e);
      setZoom((z) => (z ? null : at));
    }
  };
  const onPointerMove = (e) => {
    if (zoom && e.pointerType === 'mouse') setZoom(point(e));
  };

  const img = images[index] ?? images[0];

  return (
    <dialog
      ref={dialogRef}
      className={`glb${isMobile ? ' is-phone' : ''}`}
      aria-label={labels.open}
      onClick={(e) => { if (e.target === dialogRef.current) dialogRef.current.close(); }}
      onKeyDown={onKeyDown}
    >
      {open && img ? (
        <div className="glb-body">
          <button type="button" className="glb-close" onClick={() => dialogRef.current.close()} aria-label={labels.close}>
            <X size={22} aria-hidden="true" />
          </button>
          <figure className="glb-figure">
            <div
              className={`glb-stage${zoom ? ' is-zoomed' : ''}`}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerMove={onPointerMove}
              onPointerCancel={() => { swipe.current = null; }}
            >
              <Image
                key={img.src}
                src={img.src}
                alt={img.alt || `${index + 1}`}
                fill
                draggable={false}
                sizes="100vw"
                className="glb-image"
                style={zoom ? { transform: `scale(${ZOOM})`, transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            </div>
            <figcaption className="glb-caption">
              <span>{img.alt}</span>
              <span className="glb-hint">{labels.zoom}</span>
            </figcaption>
          </figure>
          {count > 1 ? (
            <div className="glb-nav">
              <button type="button" className="glb-arrow" onClick={() => go(-1)} aria-label={labels.prev}>
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <span className="glb-count" aria-live="polite">{index + 1} / {count}</span>
              <button type="button" className="glb-arrow" onClick={() => go(1)} aria-label={labels.next}>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
