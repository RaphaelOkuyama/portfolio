'use client';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { journeyStore } from '../../store/journey';
import { toolKey } from '../../lib/stack/tools';
import { TOOL_ICONS } from './toolIcons';
import { GRAIN, PADS, TRUNK, VIEW, leavesAround } from './bonsaiLayout';
import Section from '../journey/Section';
import Ruby from '../Ruby';
import StationSign from '../journey/StationSign';

// Copas de folhagem com contorno irregular, alternadas entre as áreas
const PAD_SHAPES = [
  '46% 54% 50% 50% / 55% 45% 55% 45%',
  '58% 42% 38% 62% / 52% 60% 40% 48%',
  '40% 60% 55% 45% / 45% 55% 45% 55%',
  '52% 48% 60% 40% / 40% 58% 42% 60%',
  '44% 56% 42% 58% / 58% 42% 58% 42%',
  '60% 40% 48% 52% / 48% 52% 46% 54%',
];
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

// 技 Stack: cada pedra do jardim zen é uma área; escolher uma abre as ferramentas
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
  // 盆栽 cresce com a rolagem: o tronco se desenha, depois os galhos, as copas brotam e as folhas
  // aparecem uma a uma. Movimento reduzido: já crescido
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = rootRef.current;
    const art = root.querySelector('.bonsai-art');
    if (!art) return;
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: art, start: 'top 90%', end: 'center 45%', scrub: 0.6 },
    })
      .from(art.querySelectorAll('.bonsai-pot, .bonsai-moss, .bonsai-shadow'), { opacity: 0, y: 8, duration: 0.12 }, 0)
      .fromTo(art.querySelectorAll('.bonsai-trunk, .bonsai-grain'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4 }, 0.05)
      .fromTo(art.querySelectorAll('.bonsai-branch'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.18, stagger: 0.04 }, 0.3)
      // No celular os botões são as linhas do acordeão: só brotam como copas no desktop
      .from(window.matchMedia('(min-width: 561px)').matches ? root.querySelectorAll('.zen-stone') : [], {
        scale: 0.2, opacity: 0, duration: 0.15, stagger: 0.04, ease: 'back.out(2)',
      }, 0.42)
      .from(art.querySelectorAll('.bonsai-crown'), { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.15, stagger: 0.04, ease: 'back.out(2)' }, 0.42)
      .from(art.querySelectorAll('.bonsai-leaf'), {
        scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.08, stagger: { each: 0.006, from: 'random' },
      }, 0.5);
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
        <div className="zen-stones bonsai" role="tablist" aria-label={techData.title} aria-orientation="horizontal">
          {/* 盆栽: tronco, galhos, vaso e as folhas (uma por ferramenta); as copas são os botões */}
          <svg className="bonsai-art" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true">
            <ellipse className="bonsai-shadow" cx="200" cy="424" rx="110" ry="6" />
            <path className="bonsai-trunk" d={TRUNK} />
            <path className="bonsai-grain" d={GRAIN} />
            {PADS.map((p) => <path key={p.branch} className="bonsai-branch" d={p.branch} />)}
            {/* Copas desenhadas: no desktop ficam atrás dos botões; no celular (os botões viram
                linhas do acordeão) são elas que vestem os galhos */}
            {PADS.map((p) => (
              <g key={`crown-${p.x}`} className="bonsai-crown">
                <ellipse cx={p.x - 18} cy={p.y + 4} rx="34" ry="20" />
                <ellipse cx={p.x + 16} cy={p.y + 2} rx="36" ry="22" />
                <ellipse cx={p.x} cy={p.y - 10} rx="32" ry="20" />
              </g>
            ))}
            {categories.map((cat, i) => (
              <g key={cat.name} className="bonsai-leaves" data-pad={i}>
                {leavesAround(PADS[i % PADS.length], cat.items.length, i).map((leaf, k) => (
                  <ellipse
                    key={cat.items[k]}
                    className={`bonsai-leaf is-tone-${leaf.tone}`}
                    cx={leaf.x}
                    cy={leaf.y}
                    rx="11"
                    ry="5"
                    transform={`rotate(${leaf.rotate} ${leaf.x} ${leaf.y})`}
                  >
                    <title>{cat.items[k]}</title>
                  </ellipse>
                ))}
              </g>
            ))}
            {/* Vaso: borda, corpo, pés e o musgo na terra */}
            <g className="bonsai-pot">
              <rect x="112" y="392" width="176" height="12" rx="3" />
              <path d="M124 404 L276 404 L264 422 L136 422 Z" />
              <rect x="146" y="422" width="18" height="5" rx="1" />
              <rect x="236" y="422" width="18" height="5" rx="1" />
            </g>
            <ellipse className="bonsai-moss" cx="200" cy="393" rx="80" ry="5" />
          </svg>
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
                '--stone-shape': PAD_SHAPES[i % PAD_SHAPES.length],
                // Ponta do galho desta área, em % do desenho (no celular não vale: vira linha)
                '--pad-x': `${(PADS[i % PADS.length].x / VIEW.w) * 100}%`,
                '--pad-y': `${(PADS[i % PADS.length].y / VIEW.h) * 100}%`,
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
              style={{ '--order': i * 2 + 1 }}
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
