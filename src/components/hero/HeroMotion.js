'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsapCore';
import { profile } from '../../data/resume';
import Section from '../journey/Section';
import { useJourney } from '../../store/journey';
import { buildNameSequence, SCRAMBLE_CHARS, NAME_HOLD_SECONDS, NAME_SCRAMBLE_SECONDS } from '../../lib/hero/name';

// Só o movimento do hero roda no cliente; o conteúdo chega pronto do servidor como children
export default function HeroMotion({ children }) {
  const heroRef = useRef(null);
  const loaderDone = useJourney((s) => s.loaderDone);

  // O nome fica visível desde o HTML do servidor (é o LCP): o fade do ensō já o revela.
  // Quando o loader termina, entra a seta de scroll e o nome japonês cicla katakana → hiragana → katakana.
  useGSAP((context) => {
    if (!loaderDone) {
      gsap.set('.hero-scroll', { autoAlpha: 0 });
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.to('.hero-scroll', { autoAlpha: 1, delay: reduced ? 0 : 1, duration: reduced ? 0 : 0.5 });
    if (reduced) return;

    const arrow = gsap.to('.hero-scroll-arrow', { keyframes: { y: [0, 10, 0], easeEach: 'sine.inOut' }, duration: 2, repeat: -1 });

    // ScrambleText e ScrollTrigger chegam sob demanda (fora do JS do carregamento, ver gsapCore):
    // o ciclo do nome só começa depois de alguns segundos mesmo
    let cancelled = false;
    import('../../lib/gsap').then(({ ScrollTrigger }) => {
      if (cancelled) return;
      context.add(() => {
        const cycle = gsap.timeline({ repeat: -1, delay: NAME_HOLD_SECONDS });
        buildNameSequence(profile).forEach((text) => {
          cycle
            .to('.hero-name-jp', {
              duration: NAME_SCRAMBLE_SECONDS,
              scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.5, revealDelay: 0.3 },
            })
            .to({}, { duration: NAME_HOLD_SECONDS });
        });

        // Os dois laços infinitos só rodam com o hero na tela (fora dela recalculavam estilo à toa)
        ScrollTrigger.create({
          trigger: heroRef.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: ({ isActive }) => [arrow, cycle].forEach((t) => (isActive ? t.resume() : t.pause())),
        });
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, { scope: heroRef, dependencies: [loaderDone] });

  return (
    <Section id="hero" className="hero-section" ref={heroRef}>
      {children}
    </Section>
  );
}
