'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { playEvolutionFanfare, playEvolutionTick } from '../../lib/sound/pokemon';
import PetSprite from './PetSprite';

// 進化: a evolução acontece no próprio bichinho, onde ele estiver (na barra ou sentado nela), sem
// cobrir a página. A forma antiga acende em branco, pisca trocando com a nova cada vez mais
// rápido entre raios pequenos, um brilho, e a nova aparece em cores; um balãozinho embaixo conta o
// que aconteceu. Esc pula. Com movimento reduzido, só troca
const SWAPS = [0.36, 0.3, 0.25, 0.21, 0.17, 0.14, 0.11, 0.09, 0.075, 0.06, 0.05, 0.045, 0.04, 0.04];

export default function Evolution({ from, to, shiny = false, scale = 1, language = 'pt', onDone }) {
  const rootRef = useRef(null);
  const en = language === 'en';
  const fromName = from.name[language] ?? from.name.pt;
  const toName = to.name[language] ?? to.name.pt;

  useEffect(() => {
    const root = rootRef.current;
    const q = (s) => root.querySelector(s);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tl = gsap.timeline({ onComplete: onDone });
    // Cada forma tem a cor e uma cópia branca por cima (a silhueta); o branco acende e apaga
    // por opacidade, sem passar pelo preto como um filtro animado passaria
    const old = q('.evo-form-from');
    const next = q('.evo-form-to');
    const oldWhite = q('.evo-form-from .evo-white');
    const newWhite = q('.evo-form-to .evo-white');
    const bubble = q('.evo-bubble');

    tl.set(next, { autoAlpha: 0, scale: 0.8 })
      .set(oldWhite, { autoAlpha: 0 })
      .set(newWhite, { autoAlpha: 1 })
      .set(q('.evo-line-2'), { autoAlpha: 0 })
      .fromTo(bubble, { autoAlpha: 0, y: -4 }, { autoAlpha: 1, y: 0, duration: 0.3 });
    if (reduced) {
      tl.set(newWhite, { autoAlpha: 0 })
        .to(old, { autoAlpha: 0, duration: 0.4 }, '+=0.6')
        .to(next, { autoAlpha: 1, scale: 1, duration: 0.4 }, '<')
        .to(q('.evo-line-1'), { autoAlpha: 0, duration: 0.2 }, '<')
        .to(q('.evo-line-2'), { autoAlpha: 1, duration: 0.2 });
    } else {
      // A forma antiga acende em branco e os raios aparecem atrás dela
      tl.to(oldWhite, { autoAlpha: 1, duration: 0.6, ease: 'power1.in' }, '+=0.25')
        .to(q('.evo-rays'), { autoAlpha: 1, scale: 1, duration: 0.6 }, '<');
      // Pisca entre as duas, cada vez mais rápido (e mais agudo)
      SWAPS.forEach((d, i) => {
        const showNew = i % 2 === 0;
        tl.call(() => playEvolutionTick(i))
          .set(old, { autoAlpha: showNew ? 0 : 1, scale: showNew ? 0.8 : 1 })
          .set(next, { autoAlpha: showNew ? 1 : 0, scale: showNew ? 1 : 0.8 })
          .to({}, { duration: d });
      });
      // Brilho: a nova forma fica e ganha cor
      tl.set(old, { autoAlpha: 0 })
        .set(next, { autoAlpha: 1, scale: 1 })
        .call(() => playEvolutionFanfare())
        .fromTo(q('.evo-glow'), { autoAlpha: 1, scale: 0.6 }, { autoAlpha: 0, scale: 1.8, duration: 0.8, ease: 'power2.out', immediateRender: false })
        .to(newWhite, { autoAlpha: 0, duration: 0.7 }, '<0.1')
        .fromTo(q('.evo-sparks'), { autoAlpha: 1, scale: 0.5 }, { autoAlpha: 0, scale: 1.5, duration: 1, ease: 'power2.out', immediateRender: false }, '<')
        .to(q('.evo-rays'), { autoAlpha: 0, duration: 0.8 }, '<0.2')
        .to(q('.evo-line-1'), { autoAlpha: 0, duration: 0.15 }, '<')
        .to(q('.evo-line-2'), { autoAlpha: 1, duration: 0.2 }, '<0.1');
    }
    tl.to(bubble, { autoAlpha: 0, y: -4, duration: 0.35 }, '+=2.6');

    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      tl.progress(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      tl.kill();
    };
  }, [onDone]);

  return (
    <span ref={rootRef} className="evo" data-evolution={to.id} style={{ '--evo-color': `var(--type-${to.type})` }}>
      <span className="evo-stage" aria-hidden="true">
        <span className="evo-rays" />
        <span className="evo-glow" />
        <span className="evo-sparks" />
        <span className="evo-form evo-form-from"><PetSprite pet={from} shiny={shiny} scale={scale} /><PetSprite pet={from} shiny={shiny} scale={scale} className="evo-white" /></span>
        <span className="evo-form evo-form-to"><PetSprite pet={to} shiny={shiny} scale={scale} /><PetSprite pet={to} shiny={shiny} scale={scale} className="evo-white" /></span>
      </span>
      <span className="evo-bubble" role="status" aria-live="polite">
        <span className="evo-line evo-line-1">{en ? `${fromName} is evolving…` : `${fromName} está evoluindo…`}</span>
        <span className="evo-line evo-line-2"><span className="evo-text">{en ? `${fromName} evolved into ${toName}!` : `${fromName} evoluiu para ${toName}!`}</span></span>
      </span>
    </span>
  );
}
