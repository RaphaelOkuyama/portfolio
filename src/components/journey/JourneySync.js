'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettings } from '../../context/SettingsContext';
import { journeyStore, useJourney } from '../../store/journey';
import { seasonNameFromMix } from '../../lib/journey/season';
import { useQuality } from '../../hooks/useQuality';

// Liga o mundo React (rota, tema, preferências) à store e espelha o estado no <html>
export default function JourneySync() {
  const pathname = usePathname();
  const { theme } = useSettings();
  const section = useJourney((s) => s.section);
  const season = useJourney((s) => seasonNameFromMix(s.seasonMix));

  useQuality();

  useEffect(() => {
    journeyStore.getState().setRoute(pathname === '/' ? 'journey' : 'frozen');
  }, [pathname]);

  useEffect(() => {
    journeyStore.getState().setTheme(theme);
  }, [theme]);

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

  return null;
}
