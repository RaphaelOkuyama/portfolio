// Nível de qualidade da cena 3D (spec §5)

export const QUALITY_SETTINGS = {
  high: { dpr: [1, 1.5], particles: 1500, postprocessing: true, sandDisplacement: true },
  low: { dpr: 1, particles: 300, postprocessing: false, sandDisplacement: false },
};

// gpuTier null = detecção falhou; aí decide só por ponteiro e largura
// (o PerformanceMonitor rebaixa depois se o FPS cair)
export function decideQuality({ pointerFine, width, gpuTier }) {
  if (!pointerFine || width < 1024) return 'low';
  if (gpuTier !== null && gpuTier < 2) return 'low';
  return 'high';
}
