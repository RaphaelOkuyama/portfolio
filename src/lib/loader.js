// Progresso do traço do ensō (0–1)
export const LOADER_MIN_MS = 1200;
export const LOADER_MAX_MS = 4000;

// Enquanto espera, o traço avança até 90% no tempo mínimo.
// Fecha quando a cena está pronta (e o mínimo passou) ou no tempo máximo.
export function loaderProgress({ elapsed, sceneReady, minMs = LOADER_MIN_MS, maxMs = LOADER_MAX_MS }) {
  if (elapsed >= maxMs) return 1;
  if (sceneReady && elapsed >= minMs) return 1;
  if (minMs === 0) return 0.9;
  return Math.min(0.9, (elapsed / minMs) * 0.9);
}
