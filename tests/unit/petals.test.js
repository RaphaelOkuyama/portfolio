import { describe, it, expect } from 'vitest';
import { createPetalData, petalOpacity, PETAL_VOLUME } from '../../src/lib/journey/petals';

describe('createPetalData', () => {
  it('gera 3 valores de posição e 3 parâmetros por pétala', () => {
    const { offsets, params } = createPetalData(50);
    expect(offsets).toBeInstanceOf(Float32Array);
    expect(offsets).toHaveLength(150);
    expect(params).toHaveLength(150);
  });

  it('posições ficam dentro do volume', () => {
    const { offsets } = createPetalData(200);
    for (let i = 0; i < 200; i++) {
      expect(offsets[i * 3]).toBeGreaterThanOrEqual(PETAL_VOLUME.x[0]);
      expect(offsets[i * 3]).toBeLessThanOrEqual(PETAL_VOLUME.x[1]);
      expect(offsets[i * 3 + 1]).toBeGreaterThanOrEqual(PETAL_VOLUME.y[0]);
      expect(offsets[i * 3 + 1]).toBeLessThanOrEqual(PETAL_VOLUME.y[1]);
      expect(offsets[i * 3 + 2]).toBeGreaterThanOrEqual(PETAL_VOLUME.z[0]);
      expect(offsets[i * 3 + 2]).toBeLessThanOrEqual(PETAL_VOLUME.z[1]);
    }
  });

  it('parâmetros: fase em [0, 2π), queda em [0.4, 1), giro em [0.5, 2)', () => {
    const { params } = createPetalData(200);
    for (let i = 0; i < 200; i++) {
      expect(params[i * 3]).toBeGreaterThanOrEqual(0);
      expect(params[i * 3]).toBeLessThan(Math.PI * 2);
      expect(params[i * 3 + 1]).toBeGreaterThanOrEqual(0.4);
      expect(params[i * 3 + 1]).toBeLessThan(1);
      expect(params[i * 3 + 2]).toBeGreaterThanOrEqual(0.5);
      expect(params[i * 3 + 2]).toBeLessThan(2);
    }
  });

  it('é determinístico pela seed', () => {
    expect(createPetalData(20, 3)).toEqual(createPetalData(20, 3));
    expect(createPetalData(20, 3).offsets).not.toEqual(createPetalData(20, 4).offsets);
  });
});

describe('petalOpacity', () => {
  it.each([[0, 1], [0.4, 0.5], [0.8, 0], [2, 0]])('mix %s → %s', (mix, expected) => {
    expect(petalOpacity(mix)).toBeCloseTo(expected, 6);
  });
});
