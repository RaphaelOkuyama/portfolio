'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { gsap } from '../../lib/gsapCore';
import { useSettings } from '../../context/SettingsContext';
import { CAPSULE, RARITY, collect, gachaDraw, gachaPool, readCollection } from '../../lib/gacha';
import { HOME_PROJECTS } from '../../lib/projects';

const TEXT = {
  pt: {
    open: 'Girar a máquina de cápsulas', title: 'Gachapon', turn: 'Girar', again: 'Girar de novo', close: 'Fechar',
    hint: 'Gire a manivela: cada cápsula traz um projeto, um certificado ou um fato. Quanto mais estrelas, mais rara.',
    kind: { project: 'Projeto', certificate: 'Certificado', fact: 'Fato' },
    go: { project: 'Ver o projeto', certificate: 'Ver os certificados' },
    fresh: 'Novo!', collection: 'Coleção', complete: 'Coleção completa!', free: '1回 無料',
  },
  en: {
    open: 'Turn the capsule machine', title: 'Gachapon', turn: 'Turn', again: 'Turn again', close: 'Close',
    hint: 'Turn the crank: each capsule holds a project, a certificate or a fact. The more stars, the rarer.',
    kind: { project: 'Project', certificate: 'Certificate', fact: 'Fact' },
    go: { project: 'See the project', certificate: 'See the certificates' },
    fresh: 'New!', collection: 'Collection', complete: 'Collection complete!', free: '1回 無料',
  },
};

// Cápsulas amontoadas no fundo do globo (posição e cor fixas: o mesmo desenho em toda visita)
const DOME = { x: 130, y: 104, r: 90 };
const INSIDE = [
  [72, 150, 'SR'], [100, 164, 'N'], [130, 170, 'R'], [160, 164, 'SSR'], [188, 150, 'N'],
  [58, 124, 'R'], [86, 136, 'N'], [115, 144, 'SR'], [145, 144, 'R'], [174, 136, 'N'], [202, 124, 'R'],
  [72, 100, 'N'], [100, 112, 'R'], [130, 118, 'N'], [160, 112, 'SR'], [188, 100, 'R'],
  [92, 86, 'R'], [122, 92, 'SSR'], [152, 88, 'N'], [176, 78, 'R'],
];
const ORDER = ['SSR', 'SR', 'R', 'N'];

function Capsule({ x, y, rarity, r = 14, tilt = 0 }) {
  return (
    <g className="gacha-shake">
      {/* O grupo de fora é o que a animação mexe; o de dentro guarda a posição no globo */}
      <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
        <circle r={r} fill="#f3eee3" />
        <path d={`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0 Z`} fill={RARITY[rarity].color} />
        <path d={`M${-r} 0 H${r}`} stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" />
        <circle r={r} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        <path d={`M${-r * 0.55} ${-r * 0.55} A${r * 0.8} ${r * 0.8} 0 0 1 ${-r * 0.05} ${-r * 0.8}`} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}

// Som da máquina, sintetizado: o clique da manivela, a cápsula caindo e o estalo ao abrir (com um
// arpejo mais alto quanto mais rara)
function createSound() {
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  const tone = (at, freq, dur, gain, type = 'sine') => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime + at);
    g.gain.setValueAtTime(gain, ctx.currentTime + at);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + dur);
    o.connect(g).connect(master);
    o.start(ctx.currentTime + at);
    o.stop(ctx.currentTime + at + dur + 0.02);
  };
  return {
    crank: () => [0, 0.16, 0.32, 0.48, 0.64].forEach((at) => tone(at, 1500, 0.04, 0.25, 'square')),
    drop: () => { tone(0, 190, 0.12, 0.7); tone(0.16, 150, 0.08, 0.4); },
    shake: (at) => tone(at, 620, 0.05, 0.2, 'triangle'),
    open: (stars) => [0, 4, 7, 12, 16].slice(0, stars + 1).forEach((semi, i) => tone(i * 0.075, 660 * 2 ** (semi / 12), 0.35, 0.3, 'triangle')),
    dispose: () => ctx.close().catch(() => {}),
  };
}

// ガチャ: a máquina de cápsulas. O botão fica no cabeçalho dos projetos; a máquina abre num
// diálogo, a manivela gira, as cápsulas do globo se remexem, uma cai na bandeja, sobe para o
// meio, treme e abre mostrando o prêmio. Cada prêmio tem raridade e entra numa coleção guardada
export default function Gachapon({ projects, certificates }) {
  const { language } = useSettings();
  const t = TEXT[language] ?? TEXT.pt;
  const pool = useMemo(() => gachaPool({ projects, certificates }, language, HOME_PROJECTS), [projects, certificates, language]);
  const [open, setOpen] = useState(false);
  const [prize, setPrize] = useState(null);
  const [busy, setBusy] = useState(false);
  const [collection, setCollection] = useState([]);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const last = useRef(null);
  const sound = useRef(null);
  const timeline = useRef(null);

  // Esc fecha; o foco volta ao botão que abriu. A coleção guardada é lida ao abrir
  useEffect(() => {
    if (!open) return undefined;
    setCollection(readCollection(window.localStorage, pool));
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    rootRef.current?.querySelector('.gacha-turn')?.focus();
    const opener = buttonRef.current;
    return () => {
      document.removeEventListener('keydown', onKey);
      timeline.current?.kill();
      timeline.current = null;
      sound.current?.dispose();
      sound.current = null;
      setBusy(false);
      opener?.focus();
    };
  }, [open, pool]);

  const reveal = (next) => {
    const saved = collect(window.localStorage, collection, next.id);
    setCollection(saved.collection);
    setPrize({ ...next, fresh: saved.fresh });
  };

  const turn = () => {
    if (busy) return;
    const next = gachaDraw(pool, Math.random, last.current);
    if (!next) return;
    last.current = next.id;
    const root = rootRef.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal(next);
      return;
    }
    setBusy(true);
    setPrize(null);
    sound.current ??= createSound();
    const audio = sound.current;
    const rarity = RARITY[next.rarity];
    const drop = root.querySelector('.gacha-drop');
    const top = root.querySelector('.gacha-drop-top');
    const bottom = root.querySelector('.gacha-drop-bottom');
    const flash = root.querySelector('.gacha-flash');
    const rays = root.querySelector('.gacha-rays');
    const machine = root.querySelector('.gacha-machine-body');
    top.querySelector('path').setAttribute('fill', rarity.color);
    flash.setAttribute('fill', rarity.color);
    rays.setAttribute('fill', rarity.color);
    gsap.set([top, bottom], { x: 0, y: 0, rotate: 0, autoAlpha: 1 });
    gsap.set(drop, { x: 0, y: -46, scale: 1, rotate: -50, autoAlpha: 0, transformOrigin: '50% 50%' });
    gsap.set([flash, rays], { scale: 0, autoAlpha: 0, rotate: 0, transformOrigin: '50% 50%' });
    // Quanto mais rara, mais a cápsula treme antes de abrir
    const shakes = 2 + rarity.stars;
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(drop, { autoAlpha: 0 });
        gsap.set(machine, { opacity: 1 });
        reveal(next);
        setBusy(false);
      },
    });
    timeline.current = tl;
    tl
      // A manivela dá uma volta em quatro trancos e as cápsulas do globo se remexem
      .call(() => audio?.crank(), null, 0)
      .to(root.querySelector('.gacha-knob'), { rotate: '+=360', duration: 0.85, ease: 'steps(5)', transformOrigin: '50% 50%' }, 0)
      .to(root.querySelectorAll('.gacha-shake'), {
        keyframes: [
          { x: () => gsap.utils.random(-7, 7), y: () => gsap.utils.random(-16, -4), rotate: () => gsap.utils.random(-50, 50) },
          { x: () => gsap.utils.random(-5, 5), y: 3, rotate: () => gsap.utils.random(-25, 25) },
          { x: 0, y: -4, rotate: 0 },
          { x: 0, y: 0 },
        ],
        duration: 0.9, stagger: { each: 0.018, from: 'random' }, ease: 'sine.inOut', transformOrigin: '50% 50%',
      }, 0.05)
      // A cápsula cai na bandeja e quica
      .call(() => audio?.drop(), null, 0.95)
      .to(drop, { autoAlpha: 1, duration: 0.05 }, 0.9)
      .to(drop, { y: 0, rotate: 0, duration: 0.55, ease: 'bounce.out' }, 0.9)
      // Sobe para o meio da máquina, que escurece atrás dela
      .to(machine, { opacity: 0.3, duration: 0.4 }, 1.55)
      .to(drop, { x: 33, y: -118, scale: 3.6, duration: 0.5, ease: 'back.out(1.4)' }, 1.55)
      .to(rays, { autoAlpha: rarity.stars >= 3 ? 0.5 : 0, scale: 1, duration: 0.4 }, 1.8)
      .to(rays, { rotate: 120, duration: 0.25 * shakes + 0.9, ease: 'none' }, 1.8);
    for (let i = 0; i < shakes; i += 1) {
      const at = 2.1 + i * 0.22;
      tl.call(() => audio?.shake(0), null, at)
        .to(drop, { rotate: i % 2 ? -14 : 14, duration: 0.09, ease: 'power1.out' }, at)
        .to(drop, { rotate: 0, duration: 0.11, ease: 'power1.in' }, at + 0.09);
    }
    const pop = 2.15 + shakes * 0.22;
    tl
      // Abre: as metades se afastam e um clarão da cor da raridade toma a máquina
      .call(() => audio?.open(rarity.stars), null, pop)
      .to(top, { y: -11, x: -3, rotate: -35, autoAlpha: 0, duration: 0.4, ease: 'power2.out', transformOrigin: '50% 100%' }, pop)
      .to(bottom, { y: 9, autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, pop)
      .to(flash, { autoAlpha: 0.9, scale: 1, duration: 0.16, ease: 'power2.out' }, pop)
      .to(flash, { autoAlpha: 0, scale: 1.5, duration: 0.4 }, pop + 0.16)
      .to(rays, { autoAlpha: 0, duration: 0.3 }, pop + 0.2);
  };

  const done = collection.length;
  const sorted = useMemo(() => [...pool].sort((a, b) => ORDER.indexOf(a.rarity) - ORDER.indexOf(b.rarity)), [pool]);

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
            <svg className="gacha-machine" viewBox="0 0 260 340" aria-hidden="true">
              <defs>
                <radialGradient id="gacha-glass" cx="0.35" cy="0.3" r="0.8">
                  <stop offset="0" stopColor="rgba(235,244,255,0.34)" />
                  <stop offset="0.6" stopColor="rgba(170,200,240,0.12)" />
                  <stop offset="1" stopColor="rgba(120,150,200,0.2)" />
                </radialGradient>
                <linearGradient id="gacha-red" x1="0" x2="1">
                  <stop offset="0" stopColor="#8f1d18" />
                  <stop offset="0.18" stopColor="#c8322a" />
                  <stop offset="0.8" stopColor="#b3261f" />
                  <stop offset="1" stopColor="#7c1814" />
                </linearGradient>
                <clipPath id="gacha-dome"><circle cx={DOME.x} cy={DOME.y} r={DOME.r - 2} /></clipPath>
              </defs>
              <g className="gacha-machine-body">
                <ellipse cx="130" cy="326" rx="104" ry="9" fill="rgba(0,0,0,0.4)" />
                <rect x="52" y="304" width="30" height="20" rx="4" fill="#7c1814" />
                <rect x="178" y="304" width="30" height="20" rx="4" fill="#7c1814" />
                <rect x="34" y="176" width="192" height="136" rx="16" fill="url(#gacha-red)" />
                <rect x="34" y="176" width="192" height="24" rx="12" fill="#7c1814" />
                <rect x="104" y="6" width="52" height="14" rx="6" fill="#b3261f" />
                <circle cx={DOME.x} cy={DOME.y} r={DOME.r} fill="rgba(12,16,30,0.55)" />
                <g className="gacha-inside" clipPath="url(#gacha-dome)">
                  {INSIDE.map(([x, y, rarity], i) => <Capsule key={`${x}-${y}`} x={x} y={y} rarity={rarity} tilt={(i * 47) % 70 - 35} />)}
                </g>
                <circle cx={DOME.x} cy={DOME.y} r={DOME.r} fill="url(#gacha-glass)" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
                <path d="M62 62 A80 80 0 0 1 118 22" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="5" strokeLinecap="round" />
                <path d="M54 92 A80 80 0 0 1 58 74" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeLinecap="round" />
                <rect x="40" y="186" width="180" height="8" rx="4" fill="#d9b46a" />
                <rect x="52" y="206" width="94" height="24" rx="5" fill="#f3eee3" />
                <text x="99" y="223" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b1b1b" className="font-jp">ガチャガチャ</text>
                <rect x="156" y="206" width="56" height="24" rx="5" fill="#1b1b1b" />
                <text x="184" y="222" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffd27a" className="font-jp">{t.free}</text>
                <g transform="translate(184 270)">
                  <circle r="27" fill="#7c1814" />
                  <g className="gacha-knob">
                    <circle r="22" fill="#f3eee3" stroke="#1b1b1b" strokeWidth="1.5" />
                    <rect x="-5" y="-20" width="10" height="40" rx="4" fill="#1b1b1b" />
                    <circle cy="-13" r="2.2" fill="#d9b46a" />
                  </g>
                </g>
                <rect x="50" y="240" width="96" height="60" rx="9" fill="#14141a" />
                <rect x="50" y="240" width="96" height="14" rx="7" fill="#26262e" />
              </g>
              <g transform="translate(97 276)">
                <circle className="gacha-rays" r="150" fill="#fff" style={{ visibility: 'hidden' }} mask="url(#gacha-rays-mask)" />
                <circle className="gacha-flash" r="120" fill="#fff" style={{ visibility: 'hidden' }} />
              </g>
              <mask id="gacha-rays-mask" maskUnits="userSpaceOnUse" x="-160" y="-160" width="320" height="320">
                {Array.from({ length: 12 }, (_, i) => (
                  <path key={i} d="M0 0 L-16 -160 L16 -160 Z" fill="#fff" transform={`rotate(${i * 30})`} />
                ))}
              </mask>
              <g transform="translate(97 276)">
                <g className="gacha-drop" style={{ visibility: 'hidden' }}>
                  <g className="gacha-drop-bottom">
                    <path d="M-16 0 A16 16 0 0 0 16 0 Z" fill="#f3eee3" stroke="rgba(0,0,0,0.45)" strokeWidth="0.8" />
                  </g>
                  <g className="gacha-drop-top">
                    <path d="M-16 0 A16 16 0 0 1 16 0 Z" fill={CAPSULE.project} stroke="rgba(0,0,0,0.45)" strokeWidth="0.8" />
                    <path d="M-9 -9 A13 13 0 0 1 -1 -13" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
                  </g>
                </g>
              </g>
            </svg>
            <div className="gacha-side">
              <div className="gacha-stage" aria-live="polite">
                {prize ? (
                  <div className="gacha-prize" data-kind={prize.kind} data-rarity={prize.rarity} style={{ '--capsule': RARITY[prize.rarity].color }}>
                    <p className="gacha-rarity">
                      <span className="gacha-stars" aria-hidden="true">{'★'.repeat(RARITY[prize.rarity].stars)}</span>
                      <b>{prize.rarity}</b>
                      {prize.fresh ? <span className="gacha-new">{t.fresh}</span> : null}
                    </p>
                    <p className="gacha-kind">{t.kind[prize.kind]}</p>
                    <p className="gacha-prize-title">{prize.title}</p>
                    {prize.text ? <p className="gacha-prize-text">{prize.text}</p> : null}
                    {prize.href ? <Link href={prize.href} className="gacha-go" onClick={() => setOpen(false)}>{t.go[prize.kind]}</Link> : null}
                  </div>
                ) : (
                  <p className="gacha-hint">{t.hint}</p>
                )}
              </div>
              <button type="button" className="gacha-turn" onClick={turn} disabled={busy}>{prize ? t.again : t.turn}</button>
              <div className="gacha-collection" data-gacha-collection="">
                <p className="gacha-collection-title">
                  <span><span className="font-jp" lang="ja" aria-hidden="true">図鑑 </span>{done === pool.length && done > 0 ? t.complete : t.collection}</span>
                  <b>{done}/{pool.length}</b>
                </p>
                <div className="gacha-dots" aria-hidden="true">
                  {sorted.map((item) => (
                    <span key={item.id} className="gacha-dot" data-on={collection.includes(item.id) ? '' : undefined} data-last={prize?.id === item.id ? '' : undefined} style={{ '--capsule': RARITY[item.rarity].color }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
