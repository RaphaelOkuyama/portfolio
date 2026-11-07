'use client';
import { useEffect } from 'react';
import { readSavedQuality } from '../lib/journey/quality';
import { journeyStore } from '../store/journey';

// Qualidade inicial: a que a pessoa escolheu antes. Sem escolha salva, fica em aberto até a cena
// começar e ler a placa de vídeo (SceneCanvas → autoQuality)
export function useQuality() {
  useEffect(() => {
    const saved = readSavedQuality(window.localStorage);
    if (saved) journeyStore.getState().setInitialQuality(saved);
  }, []);
}
