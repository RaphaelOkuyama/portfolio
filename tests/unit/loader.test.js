import { describe, it, expect } from 'vitest';
import { loaderProgress, LOADER_MIN_MS, LOADER_MAX_MS } from '../../src/lib/loader';

describe('loaderProgress', () => {
  it('usa os tempos da spec', () => {
    expect(LOADER_MIN_MS).toBe(1200);
    expect(LOADER_MAX_MS).toBe(4000);
  });

  it.each([
    [{ elapsed: 0, sceneReady: false }, 0],
    [{ elapsed: 600, sceneReady: false }, 0.45],
    [{ elapsed: 1200, sceneReady: false }, 0.9],
    [{ elapsed: 3000, sceneReady: false }, 0.9],
    [{ elapsed: 800, sceneReady: true }, 0.6],
    [{ elapsed: 1200, sceneReady: true }, 1],
    [{ elapsed: 4000, sceneReady: false }, 1],
    // Movimento reduzido: sem espera mínima
    [{ elapsed: 0, sceneReady: true, minMs: 0 }, 1],
    [{ elapsed: 0, sceneReady: false, minMs: 0 }, 0.9],
    // O máximo vale para a espera desde a navegação, mesmo com o traço recém-começado
    [{ elapsed: 300, waited: 4000, sceneReady: false }, 1],
    [{ elapsed: 300, waited: 3000, sceneReady: false }, 0.225],
  ])('%o → %s', (input, expected) => {
    expect(loaderProgress(input)).toBeCloseTo(expected, 6);
  });
});
