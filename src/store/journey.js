import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { clamp01, seasonMixFromProgress, FROZEN_PROGRESS } from '../lib/journey/season';

// Progresso que a cena deve usar: o real na jornada, o ponto fixo fora dela
export function effectiveProgress(state) {
  return state.route === 'frozen' ? FROZEN_PROGRESS : state.progress;
}

const mixFor = (progress, route) => seasonMixFromProgress(effectiveProgress({ progress, route }));

export function createJourneyStore() {
  return createStore((set, get) => ({
    progress: 0,
    section: 'hero',
    sectionProgress: 0,
    seasonMix: 0,
    theme: 'night',
    quality: null,
    reducedMotion: false,
    route: 'journey',
    assetsProgress: 0,

    setProgress: (p) => {
      const progress = clamp01(p);
      set({ progress, seasonMix: mixFor(progress, get().route) });
    },
    setSection: (section, p) => set({ section, sectionProgress: clamp01(p) }),
    setTheme: (theme) => set({ theme }),
    // Primeira detecção; depois disso só downgradeQuality muda o valor
    setInitialQuality: (quality) => {
      if (get().quality === null) set({ quality });
    },
    downgradeQuality: () => set({ quality: 'low' }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setRoute: (route) => set({ route, seasonMix: mixFor(get().progress, route) }),
    setAssetsProgress: (n) => set({ assetsProgress: Math.min(100, Math.max(0, n)) }),
  }));
}

// Instância única do app. Cenas 3D: journeyStore.getState() dentro de useFrame.
export const journeyStore = createJourneyStore();

// Componentes React: só para valores que mudam raramente
export function useJourney(selector) {
  return useStore(journeyStore, selector);
}
