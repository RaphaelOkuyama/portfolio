'use client';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { gsap } from '../lib/gsap';
import { useSettings } from '../context/SettingsContext';
import { createKonamiMatcher, TSURU_EVENT } from '../lib/easterEgg';

// Papéis de origami: shu, dourado, washi, sakura
const PAPERS = ['#c23b30', '#d9a441', '#f3eee3', '#e88fa3'];
const COUNT = 14;

// Tsuru de origami visto de lado: asas (que batem), corpo, pescoço com cabeça dobrada e cauda
function craneSvg(color) {
  return `
    <svg viewBox="0 0 64 48" width="100%" height="100%" aria-hidden="true">
      <g class="tsuru-wing">
        <polygon points="32,25 6,4 24,27" fill="${color}" />
        <polygon points="32,25 6,4 18,24" fill="#000" opacity="0.18" />
      </g>
      <polygon points="17,29 32,22 47,29 32,35" fill="${color}" />
      <polygon points="17,29 32,35 47,29" fill="#000" opacity="0.12" />
      <polygon points="45,29 57,15 55,13 61,17 56,17 49,30" fill="${color}" />
      <polygon points="19,29 5,19 15,31" fill="${color}" />
      <g class="tsuru-wing is-far">
        <polygon points="32,25 58,6 40,27" fill="${color}" />
        <polygon points="32,25 58,6 46,24" fill="#fff" opacity="0.18" />
      </g>
    </svg>`;
}

// 千羽鶴: um bando de tsurus atravessa a tela em diagonal, batendo as asas
function releaseFlock(reduced) {
  const layer = document.createElement('div');
  layer.className = 'senbazuru';
  layer.setAttribute('data-senbazuru', '');
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const tl = gsap.timeline({ onComplete: () => layer.remove() });

  for (let i = 0; i < COUNT; i++) {
    const crane = document.createElement('div');
    crane.className = 'tsuru';
    crane.innerHTML = craneSvg(PAPERS[i % PAPERS.length]);
    const size = gsap.utils.random(38, 74);
    crane.style.width = `${size}px`;
    crane.style.height = `${size * 0.75}px`;
    layer.appendChild(crane);

    if (reduced) {
      gsap.set(crane, { x: gsap.utils.random(0.1, 0.85) * w, y: gsap.utils.random(0.15, 0.75) * h });
      tl.fromTo(crane, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0).to(crane, { autoAlpha: 0, duration: 0.4 }, 2.2);
      continue;
    }

    // Sai do canto inferior esquerdo e some no superior direito, ondulando
    const startY = h * gsap.utils.random(0.55, 1.05);
    const endY = startY - h * gsap.utils.random(0.8, 1.2);
    const delay = i * 0.12 + gsap.utils.random(0, 0.25);
    const duration = gsap.utils.random(3.2, 4.6);
    gsap.set(crane, { x: -size - gsap.utils.random(0, 120), y: startY, rotate: -12 });
    tl.to(crane, { x: w + size + 40, duration, ease: 'none' }, delay)
      .to(crane, { y: endY, duration, ease: 'sine.inOut' }, delay)
      .to(crane, { rotate: gsap.utils.random(-22, -6), duration: duration / 3, yoyo: true, repeat: 2, ease: 'sine.inOut' }, delay);
  }
}

// Escuta o código Konami e o evento do hanko do rodapé; mostra um recado curto
export default function Senbazuru() {
  const { currentData } = useSettings();
  const message = useRef(currentData?.easterEgg?.message);
  message.current = currentData?.easterEgg?.message;

  useEffect(() => {
    let flying = false;
    const trigger = () => {
      if (flying) return;
      flying = true;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      releaseFlock(reduced);
      if (message.current) toast(message.current);
      setTimeout(() => {
        flying = false;
      }, 5000);
    };

    const match = createKonamiMatcher();
    const onKey = (e) => {
      // Digitando no formulário não conta
      if (e.target.closest?.('input, textarea, [contenteditable]')) return;
      if (match(e.key)) trigger();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener(TSURU_EVENT, trigger);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(TSURU_EVENT, trigger);
    };
  }, []);

  return null;
}
