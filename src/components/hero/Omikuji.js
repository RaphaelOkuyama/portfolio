'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { gsap } from '../../lib/gsap';
import { useSettings } from '../../context/SettingsContext';
import { drawOmikuji } from '../../lib/omikuji';
import { hitsTorii } from '../../lib/toriiHit';

// Cliques nesses elementos são deles: nunca viram sorteio, mesmo com o torii atrás
const OWN_CLICK = 'a, button, input, textarea, select, label, dialog, [role="button"], header, nav';

// O torii só está na tela no começo da home
const inHero = () => window.scrollY < window.innerHeight * 0.5;

// おみくじ: clicar no torii da hero tira a sorte, como nos templos. O papel se desenrola com o
// grau e as categorias; quem tira 凶 amarra o papel no galho. Sem mouse (teclado), um botão
// aparece no foco; ao passar o mouse sobre o portão, uma dica segue o cursor
export default function Omikuji({ labels }) {
  const { language } = useSettings();
  const dialogRef = useRef(null);
  const hintRef = useRef(null);
  const [fortune, setFortune] = useState(null);
  const t = labels[language] ?? labels.pt;

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const unroll = () => {
    if (reduced()) return;
    gsap.fromTo('.omikuji-slip', { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 0.9, ease: 'power3.out' });
    gsap.fromTo('.omikuji-slip-inner > *', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, delay: 0.45 });
  };

  const draw = () => {
    setFortune(drawOmikuji());
    if (!dialogRef.current.open) dialogRef.current.showModal();
    requestAnimationFrame(unroll);
  };

  const close = () => dialogRef.current?.close();

  // 凶: o papel dobra e sobe até o galho; depois fecha
  const tie = () => {
    if (reduced()) return close();
    gsap.timeline({ onComplete: close })
      .to('.omikuji-slip', { scaleY: 0.12, transformOrigin: '50% 0%', duration: 0.45, ease: 'power2.in' })
      .to('.omikuji-slip', { y: -120, rotate: -8, opacity: 0, duration: 0.5, ease: 'power2.in' })
      .set('.omikuji-slip', { clearProps: 'all' });
    return undefined;
  };

  // Clique no torii (fora de links e botões): um anel de tinta no ponto e o papel sai
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const onClick = (e) => {
      if (e.button !== 0 || dialogRef.current?.open || !inHero()) return;
      if (e.target.closest?.(OWN_CLICK)) return;
      if (!hitsTorii(e.clientX, e.clientY)) return;
      if (!reduced()) {
        const ring = document.createElement('span');
        ring.className = 'omikuji-ripple';
        ring.style.left = `${e.clientX}px`;
        ring.style.top = `${e.clientY}px`;
        document.body.appendChild(ring);
        gsap.fromTo(ring, { scale: 0.2, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => ring.remove() });
      }
      drawRef.current();
    };

    // Dica que segue o cursor sobre o portão (só mouse; o raycast roda no máximo uma vez por frame)
    const hint = hintRef.current;
    let frame = 0;
    let last = null;
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      last = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const over = inHero() && !last.target.closest?.(OWN_CLICK) && hitsTorii(last.clientX, last.clientY);
        document.documentElement.toggleAttribute('data-torii-hover', over);
        hint.dataset.visible = String(over);
        if (over) hint.style.transform = `translate(${last.clientX + 18}px, ${last.clientY + 18}px)`;
      });
    };

    // Rolar tira o portão de baixo do cursor: a dica some até o próximo movimento
    const onScroll = () => {
      if (hint.dataset.visible !== 'true') return;
      hint.dataset.visible = 'false';
      document.documentElement.removeAttribute('data-torii-hover');
    };

    window.addEventListener('click', onClick);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      document.documentElement.removeAttribute('data-torii-hover');
    };
  }, []);

  return (
    <>
      {/* Teclado: o torii do canvas não recebe foco, então um botão aparece só quando focado */}
      <button type="button" className="omikuji-skip" onClick={draw}>
        <span className="font-jp" aria-hidden="true">おみくじ</span> {t.open}
      </button>
      <span ref={hintRef} className="omikuji-hint" data-visible="false" aria-hidden="true">
        <span className="font-jp">おみくじ</span> {t.hint}
      </span>

      <dialog
        ref={dialogRef}
        className="omikuji-dialog"
        aria-labelledby="omikuji-rank"
        onClick={(e) => { if (e.target === dialogRef.current) close(); }}
      >
        {fortune && (
          <div className="omikuji-slip" data-omikuji-slip="" data-rank={fortune.rank.kanji}>
            <button type="button" className="omikuji-close" onClick={close} aria-label={t.close}>
              <X size={18} aria-hidden="true" />
            </button>
            <div className="omikuji-slip-inner">
              <p className="omikuji-number font-jp">
                <span lang="ja">第{fortune.numberKanji}番</span>
                <span className="omikuji-number-latin">{t.stick} {fortune.number}</span>
              </p>
              <h2 id="omikuji-rank" className="omikuji-rank">
                <span className="omikuji-rank-kanji font-jp" lang="ja">{fortune.rank.kanji}</span>
                <span className="omikuji-rank-name">
                  {fortune.rank[language] ?? fortune.rank.pt}
                  <span className="omikuji-rank-reading"> · {fortune.rank.reading}</span>
                </span>
              </h2>
              <dl className="omikuji-lines">
                {fortune.lines.map((line) => (
                  <div key={line.key} className="omikuji-line">
                    <dt>
                      <span className="font-jp" lang="ja">{line.kanji}</span> {line[language] ?? line.pt}
                    </dt>
                    <dd>{line.text[language] ?? line.text.pt}</dd>
                  </div>
                ))}
              </dl>
              {fortune.unlucky && <p className="omikuji-tie-note">{t.tieNote}</p>}
              <div className="omikuji-actions">
                {fortune.unlucky ? (
                  <button type="button" className="omikuji-btn is-primary" onClick={tie}>{t.tie}</button>
                ) : (
                  <button type="button" className="omikuji-btn is-primary" onClick={close}>{t.keep}</button>
                )}
                <button type="button" className="omikuji-btn" onClick={draw}>{t.again}</button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
