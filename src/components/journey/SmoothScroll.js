'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { journeyStore, useJourney } from '../../store/journey';

function nativeProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

// Scroll suave (Lenis) guiado pelo ticker do GSAP; escreve o progresso na store
export default function SmoothScroll() {
  const reducedMotion = useJourney((s) => s.reducedMotion);
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
    lenis.on('scroll', (instance) => {
      ScrollTrigger.update();
      setProgress(instance.progress);
    });
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setProgress(nativeProgress());

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  // Troca de rota: volta ao topo e recalcula os triggers da página nova
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
