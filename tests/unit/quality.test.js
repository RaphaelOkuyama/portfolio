import { describe, it, expect } from 'vitest';
import { decideQuality, QUALITY_SETTINGS } from '../../src/lib/journey/quality';

describe('decideQuality', () => {
  it.each([
    [{ pointerFine: true, width: 1440, gpuTier: 3 }, 'high'],
    [{ pointerFine: true, width: 1024, gpuTier: 2 }, 'high'],
    [{ pointerFine: true, width: 1440, gpuTier: 1 }, 'low'],
    [{ pointerFine: true, width: 1023, gpuTier: 3 }, 'low'],
    [{ pointerFine: false, width: 1440, gpuTier: 3 }, 'low'],
    // Detecção de GPU falhou: decide só por ponteiro e largura
    [{ pointerFine: true, width: 1440, gpuTier: null }, 'high'],
    [{ pointerFine: false, width: 400, gpuTier: null }, 'low'],
  ])('%o → %s', (input, expected) => expect(decideQuality(input)).toBe(expected));
});

describe('QUALITY_SETTINGS', () => {
  it('segue a tabela da spec', () => {
    expect(QUALITY_SETTINGS.high).toEqual({ dpr: [1, 1.5], particles: 1500, postprocessing: true, sandDisplacement: true });
    expect(QUALITY_SETTINGS.low).toEqual({ dpr: 1, particles: 300, postprocessing: false, sandDisplacement: false });
  });
});
