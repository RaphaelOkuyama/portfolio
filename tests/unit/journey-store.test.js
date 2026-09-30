import { describe, it, expect, beforeEach } from 'vitest';
import { createJourneyStore, effectiveProgress } from '../../src/store/journey';
import { FROZEN_PROGRESS, seasonMixFromProgress } from '../../src/lib/journey/season';

let store;
beforeEach(() => {
  store = createJourneyStore();
});

describe('estado inicial', () => {
  it('começa no hero, noite, qualidade indefinida', () => {
    const s = store.getState();
    expect(s).toMatchObject({
      progress: 0, section: 'hero', sectionProgress: 0, seasonMix: 0,
      theme: 'night', quality: null, reducedMotion: false, route: 'journey', assetsProgress: 0,
    });
  });
});

describe('setProgress', () => {
  it('limita a 0–1 e deriva seasonMix', () => {
    store.getState().setProgress(0.5);
    expect(store.getState().progress).toBe(0.5);
    expect(store.getState().seasonMix).toBe(1.5);
    store.getState().setProgress(4);
    expect(store.getState().progress).toBe(1);
    expect(store.getState().seasonMix).toBe(3);
  });

  it('em rota congelada guarda o progresso mas a estação fica no ponto fixo', () => {
    store.getState().setRoute('frozen');
    store.getState().setProgress(0.1);
    expect(store.getState().progress).toBe(0.1);
    expect(store.getState().seasonMix).toBe(seasonMixFromProgress(FROZEN_PROGRESS));
  });
});

describe('setRoute', () => {
  it('recalcula seasonMix ao entrar e sair da rota congelada', () => {
    store.getState().setProgress(0.2);
    store.getState().setRoute('frozen');
    expect(store.getState().seasonMix).toBe(seasonMixFromProgress(FROZEN_PROGRESS));
    store.getState().setRoute('journey');
    expect(store.getState().seasonMix).toBeCloseTo(0.6);
  });
});

describe('effectiveProgress', () => {
  it('usa o progresso real na jornada e o ponto fixo fora dela', () => {
    store.getState().setProgress(0.3);
    expect(effectiveProgress(store.getState())).toBe(0.3);
    store.getState().setRoute('frozen');
    expect(effectiveProgress(store.getState())).toBe(FROZEN_PROGRESS);
  });
});

describe('setSection', () => {
  it('define seção e progresso limitado', () => {
    store.getState().setSection('about', 1.7);
    expect(store.getState()).toMatchObject({ section: 'about', sectionProgress: 1 });
  });
});

describe('qualidade', () => {
  it('setInitialQuality só vale uma vez', () => {
    store.getState().setInitialQuality('high');
    store.getState().setInitialQuality('low');
    expect(store.getState().quality).toBe('high');
  });

  it('downgradeQuality rebaixa para low e não volta', () => {
    store.getState().setInitialQuality('high');
    store.getState().downgradeQuality();
    expect(store.getState().quality).toBe('low');
    store.getState().setInitialQuality('high');
    expect(store.getState().quality).toBe('low');
  });
});

describe('demais setters', () => {
  it('tema, reduced motion e assets', () => {
    store.getState().setTheme('day');
    store.getState().setReducedMotion(true);
    store.getState().setAssetsProgress(150);
    expect(store.getState()).toMatchObject({ theme: 'day', reducedMotion: true, assetsProgress: 100 });
  });
});

describe('loader', () => {
  it('começa com a cena e o loader pendentes', () => {
    expect(store.getState()).toMatchObject({ sceneReady: false, loaderDone: false });
  });

  it('marca cena pronta e loader concluído', () => {
    store.getState().setSceneReady();
    store.getState().setLoaderDone();
    expect(store.getState()).toMatchObject({ sceneReady: true, loaderDone: true });
  });
});
