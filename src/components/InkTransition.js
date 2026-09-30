'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap } from '../lib/gsap';

const COVER = 0.6;
const REVEAL = 0.7;
// Se a rota não mudar (ex.: mesma página), descobre a tela mesmo assim
const FALLBACK_MS = 2500;

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

// 墨: ao navegar, a tinta se espalha a partir do clique, a rota troca por baixo e a tinta recua
export default function InkTransition() {
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
    const layers = root.querySelectorAll('.ink-layer');
    gsap
      .timeline({ onComplete: () => { root.dataset.state = 'idle'; } })
      .to(root.querySelector('.ink-transition-hanko'), { opacity: 0, scale: 0.9, duration: 0.25 }, 0)
      .to([...layers].reverse(), {
        clipPath: 'circle(0% at 50% 50%)',
        duration: REVEAL,
        ease: 'power3.inOut',
        stagger: 0.07,
      }, 0.1);
  };

  useEffect(() => {
    const onClick = (e) => {
      const href = internalNavigation(e);
      if (!href) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const root = rootRef.current;
      if (!root || root.dataset.state !== 'idle') return;
      e.preventDefault();

      const x = `${((e.clientX || window.innerWidth / 2) / window.innerWidth) * 100}%`;
      const y = `${((e.clientY || window.innerHeight / 2) / window.innerHeight) * 100}%`;
      const layers = root.querySelectorAll('.ink-layer');
      root.dataset.state = 'cover';
      gsap
        .timeline({
          onComplete: () => {
            pending.current = true;
            router.push(href);
            fallback.current = setTimeout(reveal, FALLBACK_MS);
          },
        })
        .fromTo(layers,
          { clipPath: `circle(0% at ${x} ${y})` },
          { clipPath: `circle(150% at ${x} ${y})`, duration: COVER, ease: 'power3.inOut', stagger: 0.06 })
        .fromTo(root.querySelector('.ink-transition-hanko'),
          { opacity: 0, scale: 1.4, rotate: -14 },
          { opacity: 1, scale: 1, rotate: -6, duration: 0.3, ease: 'back.out(2)' }, '-=0.25');
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
    <div ref={rootRef} className="ink-transition" data-ink-transition="" data-state="idle" aria-hidden="true">
      <div className="ink-layer" />
      <div className="ink-layer" />
      <div className="ink-layer" />
      <span className="ink-transition-hanko font-jp">奥山</span>
    </div>
  );
}
