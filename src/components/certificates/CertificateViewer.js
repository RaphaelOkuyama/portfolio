'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { gsap } from '../../lib/gsapCore';
import { formatMonth } from '../../lib/experience';
import { pauseScroll, resumeScroll } from '../../lib/scroll';

// 賞状: o certificado aberto na própria página, emoldurado como um diploma na parede (moldura de
// madeira e passe-partout de papel), com o carimbo 証 batendo no canto. Setas (botões ou teclado)
// passam pelos certificados visíveis na ordem da página; Esc, o X ou um clique fora fecham.
// <dialog> nativo: foco preso dentro, o resto da página inerte
export default function CertificateViewer({ entries, current, onChange, onClose, labels, lang }) {
  const dialogRef = useRef(null);
  const frameRef = useRef(null);
  const stampRef = useRef(null);
  const index = entries.findIndex((e) => e.key === current);
  const entry = index >= 0 ? entries[index] : null;
  const isOpen = Boolean(entry);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      pauseScroll();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fechou por qualquer caminho (Esc, X, clique fora): a página volta a rolar
  useEffect(() => {
    const dialog = dialogRef.current;
    const handle = () => {
      resumeScroll();
      onClose();
    };
    dialog.addEventListener('close', handle);
    return () => dialog.removeEventListener('close', handle);
  }, [onClose]);

  // A cada certificado: o papel assenta na moldura e o carimbo bate
  const key = entry?.key;
  useEffect(() => {
    if (!key || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const tl = gsap.timeline();
    tl.fromTo(frameRef.current, { opacity: 0, y: 16, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' })
      .fromTo(stampRef.current, { autoAlpha: 0, scale: 1.7, rotate: -24 }, { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.42, ease: 'back.out(2.4)' }, 0.22);
    return () => tl.kill();
  }, [key]);

  const close = () => dialogRef.current?.close();
  const go = (step) => {
    if (entries.length < 2) return;
    onChange(entries[(index + step + entries.length) % entries.length].key);
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="cert-viewer"
      aria-labelledby="cert-viewer-title"
      onClick={(e) => { if (e.target === dialogRef.current) close(); }}
      onKeyDown={onKeyDown}
    >
      {entry ? (
        <div className="cert-viewer-body">
          <button type="button" className="cert-viewer-close" onClick={close} aria-label={labels.close}>
            <X size={20} aria-hidden="true" />
          </button>
          <figure className="cert-viewer-figure">
            <div
              ref={frameRef}
              className="cert-viewer-frame"
              style={{ '--ratio': entry.image.width / entry.image.height }}
            >
              <div className="cert-viewer-mat">
                <Image
                  key={entry.image.src}
                  src={entry.image.src}
                  alt={`${labels.image}: ${entry.name}`}
                  width={entry.image.width}
                  height={entry.image.height}
                  sizes="(max-width: 960px) 92vw, 900px"
                  className="cert-viewer-image"
                  priority
                />
              </div>
            </div>
            <figcaption className="cert-viewer-caption">
              <span ref={stampRef} className="cert-viewer-stamp font-jp" aria-hidden="true">証</span>
              <h2 id="cert-viewer-title" className="cert-viewer-title">{entry.name}</h2>
              <p className="cert-viewer-meta">
                {entry.institution} · {labels.issued} {formatMonth(entry.date, lang)} · {entry.hours}h
              </p>
              {/* O domínio de validação do QR code da OneBitCode não existe mais: avisar antes que
                  alguém escaneie e ache que o certificado é falso */}
              {entry.institution === 'OneBitCode' && labels.verifyNote ? (
                <p className="cert-viewer-note">{labels.verifyNote}</p>
              ) : null}
            </figcaption>
          </figure>
          {entries.length > 1 ? (
            <div className="cert-viewer-nav">
              <button type="button" className="cert-viewer-arrow" onClick={() => go(-1)} aria-label={labels.prev}>
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <span className="cert-viewer-count" aria-live="polite">{index + 1} / {entries.length}</span>
              <button type="button" className="cert-viewer-arrow" onClick={() => go(1)} aria-label={labels.next}>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
