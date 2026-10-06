'use client';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { journeyStore } from '../../store/journey';
import { toolKey } from '../../lib/stack/tools';
import { TOOL_ICONS } from './toolIcons';
import { TANABATA_COLORS, TANABATA_INK } from '../../lib/journey/tanabata';
import Section from '../journey/Section';
import Ruby from '../Ruby';
import StationSign from '../journey/StationSign';

const pad = (n) => String(n).padStart(2, '0');

// `withIcon` falso: só a caixa do ícone (painel ainda fechado). Os logos dos 6 painéis somavam
// ~65KB de SVG no HTML da home, para 1 painel visível por vez
function ToolRow({ name, withIcon }) {
  const Icon = TOOL_ICONS[toolKey(name)];
  return (
    <li className="zen-tool">
      <span className="zen-tool-icon" aria-hidden="true">
        {!withIcon ? null : Icon ? <Icon /> : <span className="zen-tool-initial">{name[0]}</span>}
      </span>
      <span className="zen-tool-name">{name}</span>
    </li>
  );
}

// 技 Stack: 七夕. Cada área é uma tira de papel (短冊) pendurada na vara de bambu, na cor das tiras
// da área nos bambus de Tanabata da cena; escolher uma abre as ferramentas (e acende as tiras dela)
export default function ZenStack({ techData, icons }) {
  const [active, setActive] = useState(0);
  // Painéis já abertos ao menos uma vez: só eles levam os logos
  const [opened, setOpened] = useState(() => new Set([0]));
  if (!opened.has(active)) setOpened(new Set(opened).add(active));
  const rootRef = useRef(null);
  const baseId = useId();
  const categories = techData.categories;

  // Destaque da pedra na cena 3D: foco/hover prevalece, senão a selecionada
  const highlight = (index) => journeyStore.getState().setActiveStone(index);
  useEffect(() => {
    highlight(active);
    return () => highlight(null);
  }, [active]);

  // A caixa dos painéis desliza da altura antiga para a nova: não pula e não sobra vazio
  const panelsRef = useRef(null);
  const lastHeight = useRef(0);
  useLayoutEffect(() => {
    const box = panelsRef.current;
    if (!box) return undefined;
    const next = box.offsetHeight;
    const prev = lastHeight.current;
    lastHeight.current = next;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // No celular é acordeão (display: contents): não há caixa para animar
    if (!prev || prev === next || reduced || getComputedStyle(box).display === 'contents') return undefined;
    const tween = gsap.fromTo(box, { height: prev }, {
      height: next, duration: 0.45, ease: 'power3.inOut', clearProps: 'height',
    });
    return () => tween.kill();
  }, [active]);

  // Painel entra ao trocar de pedra: o kanji assenta, a linha de tinta corre e as ferramentas sobem
  // As varas entram e as tiras caem penduradas, uma a uma, quando a seção aparece. No celular as
  // tiras são as linhas do acordeão: só as varas animam
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = rootRef.current;
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.querySelector('.zen-stones'), start: 'top 85%', once: true } })
      .from(root.querySelectorAll('.tanabata-pole'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6, stagger: 0.12, ease: 'power2.out' });
    if (window.matchMedia('(min-width: 561px)').matches) {
      tl.from(root.querySelectorAll('.zen-stone'), {
        y: -36, rotate: -8, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'back.out(1.8)', clearProps: 'transform,opacity',
      }, 0.25);
    }
  }, { scope: rootRef });

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const panel = rootRef.current.querySelector('.zen-panel[data-active="true"]');
    if (!panel) return;
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from(panel.querySelector('.zen-panel-kanji'), { opacity: 0, scale: 1.25, duration: 0.6 }, 0)
      .from(panel.querySelector('.zen-panel-rule'), { scaleX: 0, duration: 0.6, ease: 'power3.inOut' }, 0.05)
      .from(panel.querySelectorAll('.zen-tool'), { opacity: 0, y: 10, duration: 0.35, stagger: 0.025 }, 0.15);
  }, { scope: rootRef, dependencies: [active], revertOnUpdate: true });

  return (
    <Section id="stack" ref={rootRef} className="zen-section">
      <StationSign id="stack" kanji="技" title={techData.title} tate="技術" />
      <p className="zen-hint">{techData.hint}</p>

      {/* No celular .zen-stones e .zen-panels somem do layout (display: contents) e cada painel
          entra logo abaixo da sua pedra, como acordeão */}
      <div className="zen-layout">
        <div className="zen-stones tanabata" role="tablist" aria-label={techData.title} aria-orientation="horizontal">
          {/* As duas varas de bambu (enfeite); as tiras-botão ficam penduradas nelas */}
          <span className="tanabata-pole" aria-hidden="true" />
          <span className="tanabata-pole is-second" aria-hidden="true" />
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
              style={{
                '--tz-color': TANABATA_COLORS[i % TANABATA_COLORS.length],
                '--tz-ink': TANABATA_INK[i % TANABATA_INK.length],
                // Cada tira balança no seu ritmo
                '--tz-delay': `${(i * 0.37) % 1.6}s`,
                '--order': i * 2,
              }}
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
              <span className="zen-stone-face">
                <span className="zen-stone-kanji font-jp" aria-hidden="true">{cat.kanji}</span>
                <span className="zen-stone-icon" aria-hidden="true">{icons[i]}</span>
                <span className="zen-stone-name">{cat.name}</span>
                <span className="zen-stone-count" aria-hidden="true">{pad(cat.items.length)}</span>
              </span>
            </button>
          ))}
        </div>

        <div ref={panelsRef} className="zen-panels">
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              role="tabpanel"
              id={`${baseId}-panel-${i}`}
              aria-labelledby={`${baseId}-tab-${i}`}
              className="zen-panel"
              data-active={active === i}
              hidden={active !== i}
              style={{ '--order': i * 2 + 1, '--tz-color': TANABATA_COLORS[i % TANABATA_COLORS.length] }}
            >
              <div className="zen-panel-head">
                <span className="zen-panel-kanji font-jp" aria-hidden="true"><Ruby>{cat.kanji}</Ruby></span>
                <div>
                  <h3 className="zen-panel-title">{cat.name}</h3>
                  <p className="zen-panel-count">
                    {pad(cat.items.length)} {techData.toolsCount}
                  </p>
                </div>
              </div>
              <span className="zen-panel-rule" aria-hidden="true" />
              <ul className="zen-tools">
                {cat.items.map((item) => (
                  <ToolRow key={item} name={item} withIcon={opened.has(i)} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
