'use client';
import { useEffect } from 'react';
import { getGPUTier } from 'detect-gpu';
import { decideQuality } from '../lib/journey/quality';
import { journeyStore } from '../store/journey';

const GPU_TIMEOUT_MS = 3000;

// Tier da GPU, ou null se a detecção falhar/demorar (benchmarks vêm de CDN)
async function detectGpuTier() {
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), GPU_TIMEOUT_MS));
  const detection = getGPUTier()
    .then((result) => (result.type === 'FALLBACK' ? null : result.tier))
    .catch(() => null);
  return Promise.race([detection, timeout]);
}

export function useQuality() {
  useEffect(() => {
    let cancelled = false;
    const pointerFine = window.matchMedia('(pointer: fine)').matches;
    const width = window.innerWidth;
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
