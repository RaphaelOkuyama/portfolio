'use client';
import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { useSettings } from '../../context/SettingsContext';

// Ilha do cliente da página de certificados: filtros por área e o carimbo 証 de cada grupo.
// A lista em si chega pronta do servidor (children); o filtro só troca data-filter e o CSS esconde
export default function CertificateBoard({ filters, all, filterLabel, total, children }) {
  const [active, setActive] = useState('all');
  const { language } = useSettings();
  const rootRef = useRef(null);

  // Cada grupo visível: o carimbo bate no título e os itens sobem quando ele entra na tela
  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const groups = gsap.utils.toArray(`[data-lang="${language}"] .cert-group`, rootRef.current)
      .filter((g) => g.offsetParent !== null);
    groups.forEach((group) => {
      const stamp = group.querySelector('.cert-hanko');
      const items = group.querySelectorAll('.cert-item');
      if (reduced) {
        gsap.set(stamp, { autoAlpha: 1, scale: 1, rotate: -8 });
        return;
      }
      gsap.timeline({ scrollTrigger: { trigger: group, start: 'top 88%', once: true } })
        // Só opacidade: os itens continuam na árvore de acessibilidade antes de entrar na tela
        .from(items, { opacity: 0, y: 14, duration: 0.45, stagger: 0.04, ease: 'power2.out' }, 0)
        .fromTo(stamp, { autoAlpha: 0, scale: 1.6, rotate: -22 }, { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.45, ease: 'hanko' }, 0.15);
    });
    ScrollTrigger.refresh();
  }, { scope: rootRef, dependencies: [active, language], revertOnUpdate: true });

  const label = (text) => text[language] ?? text.pt;

  return (
    <div ref={rootRef} className="cert-board" data-filter={active}>
      <div className="cert-filters" role="group" aria-label={label(filterLabel)}>
        <button type="button" aria-pressed={active === 'all'} onClick={() => setActive('all')}>
          {label(all)} <span className="cert-filter-count">{total}</span>
        </button>
        {filters.map((f) => (
          <button key={f.area} type="button" aria-pressed={active === f.area} onClick={() => setActive(f.area)}>
            {label(f)} <span className="cert-filter-count">{f.count}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
