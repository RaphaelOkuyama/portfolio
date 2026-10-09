'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { journeyStore, useJourney } from '../../store/journey';
import { setLenis } from '../../lib/scroll';
import { feedScrollVelocity } from '../../lib/journey/wind';

function nativeProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

// Scroll suave (Lenis) guiado pelo ticker do GSAP; escreve o progresso na store
export default function SmoothScroll() {
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const loaderDone = useJourney((s) => s.loaderDone);
  const pathname = usePathname();
  const lenisRef = useRef(null);

  useEffect(() => {
    const { setProgress } = journeyStore.getState();

    if (reducedMotion) {
      const onScroll = () => setProgress(nativeProgress());
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    const lenis = new Lenis();
    lenisRef.current = lenis;
    setLenis(lenis);
    lenis.on('scroll', (instance) => {
      ScrollTrigger.update();
      setProgress(instance.progress);
      feedScrollVelocity(instance.velocity);
    });
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setProgress(nativeProgress());

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, [reducedMotion]);

  // A altura da página mudou depois das medidas (fonte que chegou tarde, bloco que carregou sob
  // demanda): sem recalcular, os pins prendem no lugar antigo e a seção dá um tranco ao fixar
  useEffect(() => {
    let last = document.documentElement.scrollHeight;
    let timer = 0;
    const observer = new ResizeObserver(() => {
      if (Math.abs(document.documentElement.scrollHeight - last) < 2) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        ScrollTrigger.refresh();
        lenisRef.current?.resize();
        last = document.documentElement.scrollHeight;
      }, 150);
    });
    observer.observe(document.body);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Enquanto o ensō carrega, a página não rola por baixo do overlay
  useEffect(() => {
    document.documentElement.classList.toggle('is-loading', !loaderDone);
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (loaderDone) lenis.start();
    else lenis.stop();
  }, [loaderDone, reducedMotion]);

  // Troca de rota: recalcula os triggers da página nova e vai ao topo,
  // ou à âncora da URL (ex.: /#contato) depois que o pin mediu a página
  useEffect(() => {
    const scrollTo = (y) => {
      const lenis = lenisRef.current;
      if (!lenis) return window.scrollTo(0, y);
      // O Lenis guarda a altura da página anterior e limitaria o scroll a ela
      lenis.resize();
      return lenis.scrollTo(y, { immediate: true, force: true });
    };
    // Na navegação do cliente o hash só aparece na URL depois do commit: lê no próximo frame
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      const hash = window.location.hash.slice(1);
      const target = hash ? document.getElementById(hash) : null;
      scrollTo(target ? target.getBoundingClientRect().top + window.scrollY : 0);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
