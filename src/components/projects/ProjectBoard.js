'use client';
import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { useSettings } from '../../context/SettingsContext';

// Ilha do cliente da página /projects: filtro por tipo e a entrada dos cartões.
// Os cartões chegam prontos do servidor (children); o filtro só troca data-filter e o CSS esconde
export default function ProjectBoard({ filters, all, filterLabel, total, children }) {
  const [active, setActive] = useState('all');
  const { language } = useSettings();
  const rootRef = useRef(null);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = gsap.utils.toArray(`[data-lang="${language}"] .pj-card`, rootRef.current)
      .filter((c) => c.offsetParent !== null);
    // Só opacidade (não autoAlpha): com visibility: hidden os leitores de tela pulariam os cartões
    // que ainda não entraram na tela
    gsap.set(cards, { opacity: 0, y: 24 });
    ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out' }),
    });
    ScrollTrigger.refresh();
  }, { scope: rootRef, dependencies: [active, language], revertOnUpdate: true });

  const label = (text) => text[language] ?? text.pt;

  return (
    <div ref={rootRef} className="pj-board" data-filter={active}>
      <div className="pj-filters" role="group" aria-label={label(filterLabel)}>
        <button type="button" aria-pressed={active === 'all'} onClick={() => setActive('all')}>
          {label(all)} <span className="pj-filter-count">{total}</span>
        </button>
        {filters.map((f) => (
          <button key={f.type} type="button" aria-pressed={active === f.type} onClick={() => setActive(f.type)}>
            {label(f)} <span className="pj-filter-count">{f.count}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
