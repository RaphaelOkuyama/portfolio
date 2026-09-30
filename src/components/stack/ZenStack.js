'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { journeyStore } from '../../store/journey';
import Section from '../journey/Section';

// Formas irregulares de pedra, alternadas entre os botões
const STONE_SHAPES = [
  '46% 54% 50% 50% / 55% 45% 55% 45%',
  '58% 42% 38% 62% / 52% 60% 40% 48%',
  '40% 60% 55% 45% / 45% 55% 45% 55%',
];

// 技 Stack: cada pedra do jardim zen é uma categoria; escolher uma abre as ferramentas
export default function ZenStack({ techData, icons }) {
  const [active, setActive] = useState(0);
  const panelRef = useRef(null);
  const rootRef = useRef(null);
  const baseId = useId();
  const categories = techData.categories;

  // Destaque da pedra na cena 3D: foco/hover prevalece, senão a selecionada
  const highlight = (index) => journeyStore.getState().setActiveStone(index);
  useEffect(() => {
    highlight(active);
    return () => highlight(null);
  }, [active]);

  // Painel entra ao trocar de pedra
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from(panelRef.current.querySelectorAll('.zen-chip'), {
      opacity: 0, y: 8, duration: 0.35, stagger: 0.03, ease: 'power2.out',
    });
  }, { scope: rootRef, dependencies: [active], revertOnUpdate: true });

  return (
    <Section id="stack" ref={rootRef} style={{ padding: '80px 0' }}>
      <h2 className="section-title">
        <span className="section-kanji font-jp" aria-hidden="true">技</span>
        {techData.title}
      </h2>
      <p className="zen-hint">{techData.hint}</p>

      <div className="zen-layout">
        <div className="zen-stones" role="tablist" aria-label={techData.title} aria-orientation="horizontal">
          {categories.map((cat, i) => (
            <button
              key={cat.name}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={active === i}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={active === i ? 0 : -1}
              className="zen-stone"
              data-active={active === i}
              style={{ borderRadius: STONE_SHAPES[i % STONE_SHAPES.length] }}
              onClick={() => setActive(i)}
              onMouseEnter={() => highlight(i)}
              onMouseLeave={() => highlight(active)}
              onFocus={() => highlight(i)}
              onKeyDown={(e) => {
                // Setas navegam entre as pedras (padrão de tabs)
                const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
                if (!delta) return;
                e.preventDefault();
                const next = (i + delta + categories.length) % categories.length;
                setActive(next);
                document.getElementById(`${baseId}-tab-${next}`)?.focus();
              }}
            >
              <span className="zen-stone-icon" aria-hidden="true">{icons[i]}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        <div ref={panelRef} className="zen-panels">
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              role="tabpanel"
              id={`${baseId}-panel-${i}`}
              aria-labelledby={`${baseId}-tab-${i}`}
              hidden={active !== i}
              className="zen-panel"
            >
              <h3 className="zen-panel-title">
                <span aria-hidden="true">{icons[i]}</span>
                {cat.name}
              </h3>
              <ul className="zen-chips">
                {cat.items.map((item) => (
                  <li key={item} className="zen-chip">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
