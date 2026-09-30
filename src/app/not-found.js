'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP } from '../lib/gsap';
import { ArrowLeft } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { journeyStore } from '../store/journey';

// Trilha de pegadas que some na névoa
const TRAIL_PATH = 'M 10 40 C 60 10, 100 70, 150 40 S 240 10, 290 40 S 380 70, 430 38';

// 迷子 (maigo, "perdido"): névoa densa na cena e uma trilha que se apaga
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

    // A trilha se desenha e depois se apaga a partir do começo, como pegadas sumindo
    gsap
      .timeline({ repeat: -1, repeatDelay: 0.6 })
      .fromTo('.nf-trail', { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 1.8, ease: 'power1.inOut' })
      .to('.nf-trail', { drawSVG: '100% 100%', duration: 1.6, ease: 'power1.in' }, '+=0.4');

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
      subtitle: "Página não encontrada",
      desc: "Parece que você se perdeu na névoa da montanha. A rota que você tentou acessar não existe ou foi refatorada.",
      btn: "Voltar para a base"
    },
    en: {
      subtitle: "Page Not Found",
      desc: "Looks like you got lost in the mountain mist. The route you tried to access doesn't exist or was refactored.",
      btn: "Return to base"
    }
  };

  const t = text[language] || text.pt;

  return (
    <div ref={rootRef} className="nf-root">
      <div className="nf-bg" aria-hidden="true">404</div>

      <p className="nf-kanji font-jp" aria-hidden="true">迷子</p>

      <svg className="nf-trail-svg" viewBox="0 0 440 80" aria-hidden="true">
        <path className="nf-trail" d={TRAIL_PATH} />
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
