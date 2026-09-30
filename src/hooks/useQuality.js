'use client';
import { useEffect } from 'react';
import { decideQuality } from '../lib/journey/quality';
import { journeyStore } from '../store/journey';

const GPU_TIMEOUT_MS = 3000;

// Tier da GPU, ou null se a detecção falhar/demorar (benchmarks self-hosted em /detect-gpu)
async function detectGpuTier() {
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), GPU_TIMEOUT_MS));
  const detection = (async () => {
    const { getGPUTier } = await import('detect-gpu');
    const result = await getGPUTier({ benchmarksURL: '/detect-gpu' });
    return result.type === 'FALLBACK' ? null : result.tier;
  })().catch(() => null);
  return Promise.race([detection, timeout]);
}

export function useQuality() {
  useEffect(() => {
    let cancelled = false;
    const pointerFine = window.matchMedia('(pointer: fine)').matches;
    const width = window.innerWidth;
    if (!pointerFine || width < 1024) {
      // decideQuality já devolve 'low' aqui; evita baixar benchmarks
      journeyStore.getState().setInitialQuality('low');
      return undefined;
    }
    detectGpuTier().then((gpuTier) => {
      if (!cancelled) {
        journeyStore.getState().setInitialQuality(decideQuality({ pointerFine, width, gpuTier }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
}
