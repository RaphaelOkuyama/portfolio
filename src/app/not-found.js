'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, prepareStroke, strokeOffset, useGSAP } from '../lib/gsapCore';
import { ArrowLeft } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { journeyStore } from '../store/journey';

// Tigela (chawan) vista de frente, numa grade de 240×160
const BOWL_BODY = 'M28 44 C 32 104, 70 132, 120 134 C 170 132, 208 104, 212 44 Z';
const BOWL_FOOT = 'M94 133 L98 148 L142 148 L146 133 Z';
// As rachaduras dividem a tigela em três cacos; o ouro corre por elas
const CRACKS = [
  [[82, 38], [90, 60], [84, 80], [98, 102], [94, 152]],
  [[152, 38], [143, 64], [157, 86], [146, 110], [152, 152]],
];
const pts = (list) => list.map(([x, y]) => `${x},${y}`).join(' ');
const reversed = (list) => [...list].reverse();
const FRAGMENTS = [
  [[0, 0], [82, 0], ...CRACKS[0], [94, 160], [0, 160]],
  [[82, 0], [152, 0], ...CRACKS[1], [152, 160], [94, 160], ...reversed(CRACKS[0])],
  [[152, 0], [240, 0], [240, 160], [152, 160], ...reversed(CRACKS[1])],
];
// Cada caco começa afastado e girado; se junta antes de o ouro aparecer
const SCATTER = [
  { x: -16, y: 6, rotate: -9 },
  { x: 0, y: 12, rotate: 3 },
  { x: 16, y: 4, rotate: 8 },
];

function Bowl() {
  return (
    <>
      <path d={BOWL_BODY} className="kintsugi-glaze" />
      <path d={BOWL_FOOT} className="kintsugi-glaze is-foot" />
      <ellipse cx="120" cy="44" rx="92" ry="12" className="kintsugi-inside" />
    </>
  );
}

// 金継ぎ (kintsugi): a cerâmica quebrada é consertada com ouro e fica mais bonita do que antes.
// A cena fecha a névoa (a pessoa se perdeu) e a página quebrada se conserta na frente dela
export default function NotFound() {
  const { language } = useSettings();
  const rootRef = useRef(null);

  // A cena fecha a névoa enquanto esta página está aberta
  useEffect(() => {
    journeyStore.getState().setLost(true);
    return () => journeyStore.getState().setLost(false);
  }, []);

  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    gsap.from('.nf-kanji', { autoAlpha: 0, y: 16, filter: 'blur(8px)', duration: 1.2, ease: 'power2.out' });
    gsap.from('.nf-fade', { opacity: 0, y: 20, duration: 0.5, stagger: 0.1, delay: 0.3, clearProps: 'transform,opacity' });

    // Os cacos se juntam, e só então o ouro corre pelas rachaduras
    gsap.timeline({ delay: 0.4 })
      .from('.kintsugi-fragment', {
        x: (i) => SCATTER[i].x,
        y: (i) => SCATTER[i].y,
        rotate: (i) => SCATTER[i].rotate,
        svgOrigin: '120 90',
        duration: 1.1,
        ease: 'power3.inOut',
      })
      // O ouro corre pelas rachaduras (tracejado deslocado: núcleo do GSAP, sem o DrawSVG)
      .fromTo('.kintsugi-gold', {
        strokeDashoffset: (i, el) => { prepareStroke(el); return strokeOffset(el, 0); },
      }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.25 }, '+=0.15')
      .to('.kintsugi-svg', { '--gold-glow': 1, duration: 0.6 }, '-=0.3');

    // "404" de fundo segue o mouse em sentido oposto
    const moveX = gsap.quickTo('.nf-bg', 'x', { duration: 1.2, ease: 'power3.out' });
    const moveY = gsap.quickTo('.nf-bg', 'y', { duration: 1.2, ease: 'power3.out' });
    const handleMouseMove = (e) => {
      moveX(((e.clientX / window.innerWidth) * 2 - 1) * -30);
      moveY(((e.clientY / window.innerHeight) * 2 - 1) * -30);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, { scope: rootRef });

  const text = {
    pt: {
      subtitle: 'Página não encontrada',
      desc: 'Esta rota quebrou ou nunca existiu. No kintsugi, o que se quebra é consertado com ouro e fica mais bonito do que antes. Vamos voltar ao caminho?',
      btn: 'Voltar ao início',
    },
    en: {
      subtitle: 'Page Not Found',
      desc: 'This route broke or never existed. In kintsugi, what breaks is repaired with gold and becomes more beautiful than before. Shall we get back on the path?',
      btn: 'Back to the start',
    },
  };

  const t = text[language] || text.pt;

  return (
    <div ref={rootRef} className="nf-root">
      <div className="nf-bg" aria-hidden="true">404</div>

      <p className="nf-kanji font-jp" aria-hidden="true">金継ぎ</p>

      <svg className="kintsugi-svg" viewBox="0 0 240 160" aria-hidden="true" data-kintsugi="">
        <defs>
          {FRAGMENTS.map((poly, i) => (
            <clipPath key={i} id={`kintsugi-piece-${i}`}>
              <polygon points={pts(poly)} />
            </clipPath>
          ))}
          <clipPath id="kintsugi-bowl">
            <path d={BOWL_BODY} />
            <path d={BOWL_FOOT} />
            <ellipse cx="120" cy="44" rx="92" ry="12" />
          </clipPath>
        </defs>
        {FRAGMENTS.map((_, i) => (
          <g key={i} className="kintsugi-fragment">
            <g clipPath={`url(#kintsugi-piece-${i})`}>
              <Bowl />
            </g>
          </g>
        ))}
        <g clipPath="url(#kintsugi-bowl)">
          {CRACKS.map((crack, i) => (
            <polyline key={i} className="kintsugi-gold" points={pts(crack)} />
          ))}
        </g>
      </svg>

      <h1 className="nf-fade nf-title">{t.subtitle}</h1>
      <p className="nf-fade nf-desc">{t.desc}</p>

      <div className="nf-fade">
        <Link href="/" className="glow-btn nf-back">
          <ArrowLeft size={20} aria-hidden="true" /> {t.btn}
        </Link>
      </div>
    </div>
  );
}
