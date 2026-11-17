'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { gsap } from '../../lib/gsapCore';
import { useSettings } from '../../context/SettingsContext';
import { CAPSULE, gachaDraw, gachaPool } from '../../lib/gacha';

const TEXT = {
  pt: {
    open: 'Girar a máquina de cápsulas', title: 'Gachapon', turn: 'Girar', again: 'Girar de novo', close: 'Fechar',
    hint: 'Gire a manivela: sai um projeto, um certificado ou um fato.',
    kind: { project: 'Projeto', certificate: 'Certificado', fact: 'Fato' },
    go: { project: 'Ver o projeto', certificate: 'Ver os certificados' },
  },
  en: {
    open: 'Turn the capsule machine', title: 'Gachapon', turn: 'Turn', again: 'Turn again', close: 'Close',
    hint: 'Turn the crank: you get a project, a certificate or a fact.',
    kind: { project: 'Project', certificate: 'Certificate', fact: 'Fact' },
    go: { project: 'See the project', certificate: 'See the certificates' },
  },
};

// Cápsulas paradas dentro do globo (posição e cor fixas: o mesmo desenho em toda visita)
const INSIDE = [
  [62, 96, 'project'], [86, 104, 'fact'], [110, 98, 'certificate'], [134, 104, 'project'], [74, 78, 'certificate'],
  [98, 82, 'project'], [122, 80, 'fact'], [146, 86, 'project'], [88, 62, 'fact'], [112, 60, 'certificate'], [132, 64, 'project'],
];

function Capsule({ x, y, kind, r = 11 }) {
  return (
    <g className="gacha-shake">
      {/* O grupo de fora é o que a animação mexe; o de dentro guarda a posição no globo */}
      <g transform={`translate(${x} ${y})`}>
        <circle r={r} fill="#f3eee3" />
        <path d={`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0 Z`} fill={CAPSULE[kind]} />
        <circle r={r} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
      </g>
    </g>
  );
}

// ガチャ: a máquina de cápsulas. O botão fica no cabeçalho dos projetos; a máquina abre num
// diálogo, a manivela gira, a cápsula cai na bandeja e abre mostrando o prêmio
export default function Gachapon({ projects, certificates }) {
  const { language } = useSettings();
  const t = TEXT[language] ?? TEXT.pt;
  const pool = useMemo(() => gachaPool({ projects, certificates }, language), [projects, certificates, language]);
  const [open, setOpen] = useState(false);
  const [prize, setPrize] = useState(null);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const last = useRef(null);

  // Esc fecha; o foco volta ao botão que abriu
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    rootRef.current?.querySelector('.gacha-turn')?.focus();
    const opener = buttonRef.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [open]);

  const turn = () => {
    if (busy) return;
    const next = gachaDraw(pool, Math.random, last.current);
    if (!next) return;
    last.current = next.id;
    const root = rootRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setPrize(next);
      return;
    }
    setBusy(true);
    setPrize(null);
    const drop = root.querySelector('.gacha-drop');
    drop.querySelector('path').setAttribute('fill', CAPSULE[next.kind]);
    gsap.timeline({ onComplete: () => { setPrize(next); setBusy(false); } })
      // A manivela dá uma volta e as cápsulas do globo chacoalham
      .to(root.querySelector('.gacha-knob'), { rotate: '+=360', duration: 0.7, ease: 'power2.inOut', svgOrigin: '140 204' })
      .to(root.querySelectorAll('.gacha-shake'), {
        keyframes: [{ y: -5 }, { y: 2 }, { y: -2 }, { y: 0 }], duration: 0.6, stagger: { each: 0.02, from: 'random' }, ease: 'none',
      }, 0.1)
      // A cápsula cai na bandeja, quica e para
      .fromTo(drop, { autoAlpha: 1, y: -34, rotate: -40 }, { y: 0, rotate: 0, scale: 1, duration: 0.5, ease: 'bounce.out', svgOrigin: '78 208' }, 0.75)
      .to(drop, { scale: 1.25, duration: 0.18, ease: 'power2.out' }, '+=0.12')
      .to(drop, { autoAlpha: 0, scale: 1.6, duration: 0.14 });
  };

  return (
    <>
      <button ref={buttonRef} type="button" className="gacha-open" aria-label={t.open} title={t.open} aria-haspopup="dialog" onClick={() => { setPrize(null); setOpen(true); }}>
        <svg viewBox="0 0 24 28" width="20" height="24" aria-hidden="true">
          <circle cx="12" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 16h14l1.5 10h-17z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="12" cy="21" r="2" fill="currentColor" />
          <circle cx="9" cy="9" r="2.2" fill="var(--hanko, #c8322a)" />
          <circle cx="14.5" cy="7" r="2.2" fill="currentColor" opacity="0.5" />
        </svg>
        <span className="font-jp" lang="ja" aria-hidden="true">ガチャ</span>
      </button>
      {/* No <body>: o cabeçalho dos projetos fica preso na rolagem (transformado), e um diálogo
          fixo dentro dele sairia do lugar */}
      {open ? createPortal(
        <div className="gacha-veil" onPointerDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div ref={rootRef} className="gacha" role="dialog" aria-modal="true" aria-label={t.title} data-gacha="">
            <button type="button" className="gacha-close" aria-label={t.close} onClick={() => setOpen(false)}>×</button>
            <svg className="gacha-machine" viewBox="0 0 208 260" aria-hidden="true">
              <rect x="34" y="118" width="140" height="124" rx="10" fill="#b3261f" />
              <rect x="34" y="118" width="140" height="18" fill="#8f1d18" />
              <rect x="50" y="146" width="108" height="26" rx="4" fill="#f3eee3" />
              <text x="104" y="165" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1b1b1b" className="font-jp">ガチャガチャ</text>
              <circle cx="104" cy="74" r="62" fill="rgba(210,228,255,0.16)" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
              <g className="gacha-inside">
                {INSIDE.map(([x, y, kind]) => <Capsule key={`${x}-${y}`} x={x} y={y} kind={kind} />)}
              </g>
              <path d="M62 44 A52 52 0 0 1 104 22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
              <g transform="translate(140 204)">
                <g className="gacha-knob">
                  <circle r="17" fill="#f3eee3" stroke="#1b1b1b" strokeWidth="1.5" />
                  <rect x="-4" y="-15" width="8" height="30" rx="3" fill="#1b1b1b" />
                </g>
              </g>
              <rect x="50" y="186" width="56" height="40" rx="6" fill="#1b1b1b" />
              <g transform="translate(78 208)">
                <g className="gacha-drop" style={{ visibility: 'hidden' }}>
                  <circle r="13" fill="#f3eee3" />
                  <path d="M-13 0 A13 13 0 0 1 13 0 Z" fill={CAPSULE.project} />
                  <circle r="13" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
                </g>
              </g>
              <rect x="46" y="242" width="22" height="12" rx="3" fill="#8f1d18" />
              <rect x="140" y="242" width="22" height="12" rx="3" fill="#8f1d18" />
            </svg>
            <div className="gacha-side" aria-live="polite">
              {prize ? (
                <div className="gacha-prize" data-kind={prize.kind} style={{ '--capsule': CAPSULE[prize.kind] }}>
                  <p className="gacha-kind">{t.kind[prize.kind]}</p>
                  <p className="gacha-prize-title">{prize.title}</p>
                  {prize.text ? <p className="gacha-prize-text">{prize.text}</p> : null}
                  {prize.href ? <Link href={prize.href} className="gacha-go" onClick={() => setOpen(false)}>{t.go[prize.kind]}</Link> : null}
                </div>
              ) : (
                <p className="gacha-hint">{t.hint}</p>
              )}
              <button type="button" className="gacha-turn" onClick={turn} disabled={busy}>{prize ? t.again : t.turn}</button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
