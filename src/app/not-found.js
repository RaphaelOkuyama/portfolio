'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, prepareStroke, strokeOffset, useGSAP } from '../lib/gsapCore';
import { ArrowLeft } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { journeyStore } from '../store/journey';

// O "404" é a própria cerâmica: os algarismos em mincho, numa grade de 720×300
const VIEW = { width: 720, height: 300 };
// Duas rachaduras, uma em cada canto, cortando as hastes dos algarismos (é nelas que o ouro
// aparece): a de cima sai da borda esquerda e sobe pelo topo do zero; a de baixo sai da borda
// direita e desce pela base dele. Dividem a peça em três cacos
const CRACKS = [
  [[0, 118], [110, 152], [178, 96], [262, 142], [330, 0]],
  [[720, 190], [650, 160], [560, 214], [470, 170], [430, 240], [400, 300]],
];
const pts = (list) => list.map(([x, y]) => `${x},${y}`).join(' ');
const reversed = (list) => [...list].reverse();
const FRAGMENTS = [
  [[0, 0], ...reversed(CRACKS[0])],
  [...CRACKS[0], [VIEW.width, 0], ...CRACKS[1], [0, VIEW.height]],
  [...CRACKS[1], [VIEW.width, VIEW.height]],
];
// Cada caco começa afastado e girado; se junta antes de o ouro aparecer
const SCATTER = [
  { x: -26, y: -18, rotate: -5 },
  { x: 0, y: 12, rotate: 1 },
  { x: 28, y: 20, rotate: 5 },
];

function Numerals(props) {
  return (
    <text x={VIEW.width / 2} y="262" textAnchor="middle" className="kintsugi-numerals" {...props}>404</text>
  );
}

// 金継ぎ (kintsugi): a cerâmica quebrada é consertada com ouro e fica mais bonita do que antes.
// A cena fecha a névoa (a pessoa se perdeu) e o próprio 404, partido em três, se conserta com ouro
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

    gsap.from('.nf-fade', { opacity: 0, y: 18, duration: 0.6, stagger: 0.09, delay: 1.5, ease: 'power3.out', clearProps: 'transform,opacity' });

    // Os cacos se juntam, e só então o ouro corre pelas rachaduras
    gsap.timeline({ delay: 0.3 })
      .from('.kintsugi-fragment', {
        x: (i) => SCATTER[i].x,
        y: (i) => SCATTER[i].y,
        rotate: (i) => SCATTER[i].rotate,
        opacity: 0,
        svgOrigin: `${VIEW.width / 2} ${VIEW.height / 2}`,
        duration: 1.2,
        ease: 'power3.inOut',
      })
      // O ouro corre pelas rachaduras (tracejado deslocado: núcleo do GSAP, sem o DrawSVG)
      .fromTo('.kintsugi-gold', {
        strokeDashoffset: (i, el) => { prepareStroke(el); return strokeOffset(el, 0); },
      }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.25 }, '+=0.1')
      .to('.kintsugi-svg', { '--gold-glow': 1, duration: 0.6 }, '-=0.3');

    // A peça pende de leve para o lado do mouse, como algo pousado numa prateleira
    const tiltX = gsap.quickTo('.kintsugi-svg', 'x', { duration: 1.2, ease: 'power3.out' });
    const tiltY = gsap.quickTo('.kintsugi-svg', 'y', { duration: 1.2, ease: 'power3.out' });
    const handleMouseMove = (e) => {
      tiltX(((e.clientX / window.innerWidth) * 2 - 1) * 10);
      tiltY(((e.clientY / window.innerHeight) * 2 - 1) * 6);
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
      <svg
        className="kintsugi-svg"
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        aria-hidden="true"
        data-kintsugi=""
      >
        <defs>
          {/* Esmalte claro, mais escuro na base, como uma peça vista de frente */}
          <linearGradient id="kintsugi-glaze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="kintsugi-glaze-top" />
            <stop offset="1" className="kintsugi-glaze-foot" />
          </linearGradient>
          {FRAGMENTS.map((poly, i) => (
            <clipPath key={i} id={`kintsugi-piece-${i}`}>
              <polygon points={pts(poly)} />
            </clipPath>
          ))}
          <clipPath id="kintsugi-shape">
            <Numerals />
          </clipPath>
        </defs>
        {FRAGMENTS.map((_, i) => (
          <g key={i} className="kintsugi-fragment">
            <g clipPath={`url(#kintsugi-piece-${i})`}>
              <Numerals fill="url(#kintsugi-glaze)" />
            </g>
          </g>
        ))}
        <g clipPath="url(#kintsugi-shape)">
          {CRACKS.map((crack, i) => (
            <polyline key={i} className="kintsugi-gold" points={pts(crack)} />
          ))}
        </g>
      </svg>

      <div className="nf-body">
        <p className="nf-kanji font-jp" lang="ja" aria-hidden="true">金継ぎ</p>
        <div className="nf-copy">
          <h1 className="nf-fade nf-title">{t.subtitle}</h1>
          <p className="nf-fade nf-desc">{t.desc}</p>
          <div className="nf-fade">
            <Link href="/" className="glow-btn nf-back">
              <ArrowLeft size={20} aria-hidden="true" /> {t.btn}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
