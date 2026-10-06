import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { clamp01, seasonMixFromProgress, FROZEN_PROGRESS } from '../lib/journey/season';
import { lanternLabel } from '../lib/journey/lanterns';
import { stepDown } from '../lib/journey/quality';

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
    sceneReady: false,
    loaderDone: false,
    // Faixa [início, fim] de cada seção em fração do progresso (medida pelo ScrollTrigger)
    sectionRanges: {},
    // Pedra do jardim zen em destaque (índice da categoria do Stack) ou null
    activeStone: null,
    // Quantas mensagens do contato já viraram lanterna (a cena solta uma por envio)
    lanternReleases: 0,
    // Nome escrito no papel de cada lanterna solta (mesma ordem de lanternReleases)
    lanternNames: [],
    // Página 404 aberta: a cena fecha a névoa (迷子)
    lost: false,
    // 無限月読: a lua clicada virou o olho e a página ficou vermelha (easter egg)
    tsukuyomi: false,

    setProgress: (p) => {
      const progress = clamp01(p);
      set({ progress, seasonMix: mixFor(progress, get().route) });
    },
    setSection: (section, p) => set({ section, sectionProgress: clamp01(p) }),
    setTheme: (theme) => set({ theme }),
    // Primeira leitura (escolha salva ou o mínimo); depois só a pessoa ou a queda de FPS mudam
    setInitialQuality: (quality) => {
      if (get().quality === null) set({ quality });
    },
    // Escolha da pessoa no seletor de gráficos
    setQuality: (quality) => set({ quality }),
    // FPS caiu: desce um degrau só nesta visita (a escolha salva não muda)
    downgradeQuality: () => set({ quality: stepDown(get().quality) }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setRoute: (route) => set({ route, seasonMix: mixFor(get().progress, route) }),
    setAssetsProgress: (n) => set({ assetsProgress: Math.min(100, Math.max(0, n)) }),
    setSceneReady: () => set({ sceneReady: true }),
    setLoaderDone: () => set({ loaderDone: true }),
    setSectionRange: (id, start, end) => {
      const range = [clamp01(start), clamp01(end)];
      const prev = get().sectionRanges[id];
      if (prev && Math.abs(prev[0] - range[0]) < 1e-4 && Math.abs(prev[1] - range[1]) < 1e-4) return;
      set({ sectionRanges: { ...get().sectionRanges, [id]: range } });
    },
    setActiveStone: (activeStone) => set({ activeStone }),
    releaseLantern: (name = '') =>
      set({ lanternReleases: get().lanternReleases + 1, lanternNames: [...get().lanternNames, lanternLabel(name)] }),
    setLost: (lost) => set({ lost }),
    setTsukuyomi: (tsukuyomi) => set({ tsukuyomi }),
  }));
}

// Instância única do app. Cenas 3D: journeyStore.getState() dentro de useFrame.
export const journeyStore = createJourneyStore();

// Componentes React: só para valores que mudam raramente
export function useJourney(selector) {
  return useStore(journeyStore, selector);
}
