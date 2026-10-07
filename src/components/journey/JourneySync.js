'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSettings } from '../../context/SettingsContext';
import { journeyStore, useJourney } from '../../store/journey';
import { seasonNameFromMix } from '../../lib/journey/season';
import { useQuality } from '../../hooks/useQuality';

// Liga o mundo React (rota, tema, preferências) à store e espelha o estado no <html>
export default function JourneySync() {
  const pathname = usePathname();
  const { theme, language } = useSettings();
  const section = useJourney((s) => s.section);
  const season = useJourney((s) => seasonNameFromMix(s.seasonMix));
  const lost = useJourney((s) => s.lost);

  useQuality();

  useEffect(() => {
    journeyStore.getState().setRoute(pathname === '/' ? 'journey' : 'frozen');
  }, [pathname]);

  // Fora da home: baixa os chunks das seções dela quando o navegador fica ocioso (ver HomeSections)
  useEffect(() => {
    if (pathname === '/') return undefined;
    const preload = () => import('../HomeSections').then((m) => m.preloadHomeSections()).catch(() => {});
    if (!('requestIdleCallback' in window)) {
      const id = setTimeout(preload, 2000);
      return () => clearTimeout(id);
    }
    const id = window.requestIdleCallback(preload, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }, [pathname]);

  useEffect(() => {
    journeyStore.getState().setTheme(theme);
  }, [theme]);

  // Trocar o idioma muda a altura dos textos: os gatilhos de scroll só recalculam posições
  // (no frame seguinte, com o texto novo já no DOM). Nada é desmontado, a rolagem fica onde está
  const firstLanguage = useRef(true);
  useEffect(() => {
    if (firstLanguage.current) {
      firstLanguage.current = false;
      return undefined;
    }
    // O ScrollTrigger vem sob demanda (os plugins não entram no carregamento; ver lib/gsapCore)
    const id = requestAnimationFrame(() => {
      import('../../lib/gsap').then(({ ScrollTrigger }) => ScrollTrigger.refresh()).catch(() => {});
    });
    return () => cancelAnimationFrame(id);
  }, [language]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => journeyStore.getState().setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.section = section;
  }, [section]);

  useEffect(() => {
    document.documentElement.dataset.season = season;
  }, [season]);

  useEffect(() => {
    if (lost) document.documentElement.dataset.lost = 'true';
    else delete document.documentElement.dataset.lost;
  }, [lost]);

  return null;
}
