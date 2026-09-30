import { describe, it, expect } from 'vitest';
import { smoothstep, bandOpacity, summerWeight, autumnWeight, winterWeight, power2InOut, responsiveFov } from '../../src/lib/journey/math';
import { sumiPath } from '../../src/lib/journey/sumi';

describe('smoothstep e bandOpacity', () => {
  it('smoothstep limita e suaviza', () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it('bandOpacity é 1 dentro da faixa e 0 fora', () => {
    expect(bandOpacity(0.5, 0.3, 0.6, 0.05)).toBe(1);
    expect(bandOpacity(0.2, 0.3, 0.6, 0.05)).toBe(0);
    expect(bandOpacity(0.7, 0.3, 0.6, 0.05)).toBe(0);
  });
});

describe('pesos das estações', () => {
  it.each([[1, 1], [0.3, 0], [1.35, 0.5]])('verão em %s → %s', (mix, w) => expect(summerWeight(mix)).toBeCloseTo(w, 6));
  it.each([[2, 1], [1.2, 0], [2.4, 0.5]])('outono em %s → %s', (mix, w) => expect(autumnWeight(mix)).toBeCloseTo(w, 6));
  it.each([[2.1, 0], [2.55, 0.5], [3, 1]])('inverno em %s → %s', (mix, w) => expect(winterWeight(mix)).toBeCloseTo(w, 6));
});

describe('power2InOut', () => {
  it.each([[0, 0], [0.25, 0.125], [0.5, 0.5], [0.75, 0.875], [1, 1]])('%s → %s', (t, v) => expect(power2InOut(t)).toBeCloseTo(v, 6));
});

describe('sumiPath', () => {
  it('começa no topo, termina na altura dada e é determinística', () => {
    const d = sumiPath(600);
    expect(d.startsWith('M 20 0')).toBe(true);
    expect(d.trim().endsWith(' 600.0')).toBe(true);
    expect(sumiPath(600)).toBe(d);
    expect(d.match(/C/g)).toHaveLength(8);
  });
});

describe('responsiveFov', () => {
  it('50° em telas largas, mais aberto em telas em pé, até 85°', () => {
    expect(responsiveFov(16 / 9)).toBe(50);
    expect(responsiveFov(1)).toBe(50);
    const tall = responsiveFov(0.7);
    expect(tall).toBeGreaterThan(50);
    expect(tall).toBeLessThan(85);
    expect(responsiveFov(0.2)).toBe(85);
  });
});
