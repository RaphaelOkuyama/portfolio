import { describe, it, expect } from 'vitest';
import { cameraT, cameraMapParams } from '../../src/lib/journey/cameraMap';

describe('cameraT', () => {
  const params = { crossAt: 0.1, toriiT: 0.2 };

  it('começo e fim do caminho não mudam', () => {
    expect(cameraT(0, params)).toBe(0);
    expect(cameraT(1, params)).toBe(1);
  });

  it('chega ao torii exatamente no momento da travessia', () => {
    expect(cameraT(0.1, params)).toBeCloseTo(0.2, 6);
    expect(cameraT(0.05, params)).toBeCloseTo(0.1, 6);
  });

  it('depois da travessia percorre o resto linearmente', () => {
    expect(cameraT(0.55, params)).toBeCloseTo(0.6, 6);
  });

  it('é monotônica e limita fora da faixa', () => {
    let last = -1;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const t = cameraT(p, params);
      expect(t).toBeGreaterThanOrEqual(last);
      last = t;
    }
    expect(cameraT(-1, params)).toBe(0);
    expect(cameraT(2, params)).toBe(1);
  });
});

describe('cameraMapParams', () => {
  it('travessia dentro da faixa do "Sobre" e portão a uma distância fixa', () => {
    const p = cameraMapParams([0.1, 0.3], 120, { toriiDistance: 18, anchor: 0.35 });
    expect(p.crossAt).toBeCloseTo(0.17, 6);
    expect(p.toriiT).toBeCloseTo(0.15, 6);
  });
});
