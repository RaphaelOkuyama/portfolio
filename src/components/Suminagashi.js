'use client';
import { useEffect } from 'react';

// Cartões com tinta flutuando no hover (o ::before de cada um, ver globals.css)
const CARDS = '.pj-card, .emaki-panel';

// 墨流し (suminagashi): a tinta pingada na água abre anéis que a correnteza deforma, e o papel
// encostado na superfície guarda o desenho. Aqui o filtro deforma anéis concêntricos de tinta
// no fundo dos cartões, e os anéis nascem do ponto por onde o mouse entrou
export default function Suminagashi() {
  useEffect(() => {
    const onOver = (e) => {
      const card = e.target.closest?.(CARDS);
      if (!card || card.contains(e.relatedTarget)) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sumi-x', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--sumi-y', `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    document.addEventListener('pointerover', onOver, { passive: true });
    return () => document.removeEventListener('pointerover', onOver);
  }, []);

  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <filter id="suminagashi" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="2" seed="7" result="water" />
        <feDisplacementMap in="SourceGraphic" in2="water" scale="46" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
