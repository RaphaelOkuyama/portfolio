'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap } from '../lib/gsapCore';
import Kamon from './Kamon';

const COVER = 0.6;
const REVEAL = 0.75;
// Rede de segurança se a rota nunca trocar (link para a mesma página já é ignorado antes):
// longa o bastante para um aparelho lento não abrir as faixas ainda na página antiga
const FALLBACK_MS = 8000;

// Link interno que troca de página (âncora na mesma página segue o comportamento normal)
function internalNavigation(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const anchor = e.target.closest?.('a[href]');
  // data-no-transition: o link já tem transição própria (ex.: painel do emakimono)
  if (!anchor || anchor.hasAttribute('download') || anchor.hasAttribute('data-no-transition')) return null;
  const target = anchor.getAttribute('target');
  if (target && target !== '_self') return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

// 暖簾 (noren): a cortina de tecido das portas japonesas. Ao navegar, as duas faixas descem do
// varão e cobrem a tela, a rota troca por baixo e elas se abrem para os lados, como quem entra
export default function NorenTransition() {
  const rootRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef(false);
  const fallback = useRef(null);

  const reveal = () => {
    const root = rootRef.current;
    if (!root || !pending.current) return;
    pending.current = false;
    clearTimeout(fallback.current);
    root.dataset.state = 'reveal';
    // Cada faixa sai para o seu lado, inclinando como tecido empurrado
    gsap
      .timeline({ onComplete: () => { root.dataset.state = 'idle'; } })
      .to(root.querySelectorAll('.noren-panel'), {
        xPercent: (i) => (i === 0 ? -120 : 120),
        skewX: (i) => (i === 0 ? 8 : -8),
        duration: REVEAL,
        ease: 'power3.inOut',
      });
  };

  useEffect(() => {
    const onClick = (e) => {
      const href = internalNavigation(e);
      if (!href) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const root = rootRef.current;
      if (!root || root.dataset.state !== 'idle') return;
      e.preventDefault();

      root.dataset.state = 'cover';
      gsap
        .timeline({
          onComplete: () => {
            pending.current = true;
            router.push(href);
            fallback.current = setTimeout(reveal, FALLBACK_MS);
          },
        })
        // As faixas descem do varão e balançam um pouco ao parar
        .fromTo(root.querySelectorAll('.noren-panel'),
          // y em px zerado: o GSAP guarda o deslocamento em px e em % separados
          { yPercent: -102, y: 0, xPercent: 0, skewX: 0 },
          { yPercent: 0, duration: COVER, ease: 'power3.out', stagger: 0.07 })
        .fromTo(root.querySelectorAll('.noren-panel'),
          { skewX: (i) => (i === 0 ? -2.5 : 2.5) },
          { skewX: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, '-=0.25');
    };
    // Captura no window: roda antes do <Link> do Next, que navegaria na hora.
    // O preventDefault aqui faz o Link desistir; os outros onClick (ex.: fechar o menu) seguem rodando.
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('click', onClick, true);
      clearTimeout(fallback.current);
    };
  }, [router]);

  // Nova página montada: espera dois frames (layout e scroll ao topo) e descobre
  useEffect(() => {
    if (!pending.current) return undefined;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(reveal);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [pathname]);

  return (
    <div ref={rootRef} className="noren" data-page-transition="" data-state="idle" aria-hidden="true">
      {/* O kamon 奥山 fica inteiro em cada faixa, centrado na emenda: cada uma mostra a sua metade */}
      {['left', 'right'].map((side) => (
        <div key={side} className={`noren-panel is-${side}`}>
          <Kamon className="noren-crest" size={null} />
        </div>
      ))}
    </div>
  );
}
