'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { useSettings } from '../../context/SettingsContext';
import CertificateViewer from './CertificateViewer';

// Prévia que segue o mouse (só com mouse de verdade): largura em px; a altura vem da proporção
const PEEK_WIDTH = 248;

function isPlainClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

// Ilha do cliente da página de certificados: filtros por área, o carimbo 証 de cada grupo, a
// prévia do certificado ao passar o mouse e o visualizador (賞状) ao clicar.
// A lista em si chega pronta do servidor (children); o filtro só troca data-filter e o CSS esconde.
// Sem JavaScript, "Ver certificado" abre a imagem do certificado numa aba nova
export default function CertificateBoard({ filters, all, filterLabel, total, entries, viewerLabels, children }) {
  const [active, setActive] = useState('all');
  const [viewing, setViewing] = useState(null);
  const { language } = useSettings();
  const rootRef = useRef(null);
  const peekRef = useRef(null);

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

  // O visualizador percorre o que está na tela: o idioma atual e a área filtrada
  const visible = useMemo(() => {
    const list = entries[language] ?? entries.pt;
    return active === 'all' ? list : list.filter((e) => e.area === active);
  }, [entries, language, active]);

  const openFrom = (e) => {
    const trigger = e.target.closest?.('[data-cert]');
    if (!trigger || !isPlainClick(e)) return;
    e.preventDefault();
    setViewing(trigger.dataset.cert);
  };
  const closeViewer = useCallback(() => setViewing(null), []);

  // Prévia: o certificado em miniatura, emoldurado, acompanha o mouse sobre a linha da lista
  useEffect(() => {
    const root = rootRef.current;
    const peek = peekRef.current;
    if (!root || !peek) return undefined;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const img = peek.querySelector('img');
    const toX = gsap.quickTo(peek, 'x', { duration: 0.5, ease: 'power3.out' });
    const toY = gsap.quickTo(peek, 'y', { duration: 0.5, ease: 'power3.out' });
    let current = null;
    const hide = () => {
      current = null;
      gsap.to(peek, { autoAlpha: 0, scale: 0.94, duration: 0.2, overwrite: 'auto' });
    };
    const move = (e) => {
      const target = e.target.closest?.('[data-peek]');
      if (target !== current) {
        current = target;
        if (!target) {
          hide();
        } else {
          img.src = target.dataset.peek;
          peek.style.setProperty('--ratio', target.dataset.peekRatio ?? '1.41');
          gsap.to(peek, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        }
      }
      if (!current) return;
      const height = PEEK_WIDTH / Number(peek.style.getPropertyValue('--ratio') || 1.41);
      // À direita e abaixo do cursor; perto da borda, passa para o outro lado
      const x = e.clientX + 28 + PEEK_WIDTH > window.innerWidth - 12 ? e.clientX - PEEK_WIDTH - 28 : e.clientX + 28;
      const y = Math.min(e.clientY + 24, window.innerHeight - height - 12);
      toX(x);
      toY(y);
    };
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', hide);
    // Rolando sem mexer o mouse a linha sai de baixo dele: a prévia some
    window.addEventListener('scroll', hide, { passive: true });
    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', hide);
      window.removeEventListener('scroll', hide);
    };
  }, []);

  const label = (text) => text[language] ?? text.pt;

  return (
    <div ref={rootRef} className="cert-board" data-filter={active} onClick={openFrom}>
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
      <div ref={peekRef} className="cert-peek" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- prévia trocada a cada linha, fora do React */}
        <img alt="" decoding="async" />
      </div>
      <CertificateViewer
        entries={visible}
        current={viewing}
        onChange={setViewing}
        onClose={closeViewer}
        labels={label(viewerLabels)}
        lang={language}
      />
    </div>
  );
}
