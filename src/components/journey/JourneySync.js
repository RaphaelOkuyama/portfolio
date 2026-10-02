'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSettings } from '../../context/SettingsContext';
import { journeyStore, useJourney } from '../../store/journey';
import { seasonNameFromMix } from '../../lib/journey/season';
import { useQuality } from '../../hooks/useQuality';
import { ScrollTrigger } from '../../lib/gsap';

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
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
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
