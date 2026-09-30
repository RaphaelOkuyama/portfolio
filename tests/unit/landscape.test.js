import { describe, it, expect } from 'vitest';
import { ridgePoints } from '../../src/lib/journey/ridge';
import {
  ridgeHeightAt, ridgeProfile, forestPlacements, kasumiBands, flockX, flockFormation,
} from '../../src/lib/journey/landscape';

const layer = { seed: 101, width: 160, segments: 160, baseHeight: -1, amplitude: 7, valleyCenter: 0, valleyDepth: 0.8, valleyWidth: 18 };
const points = ridgePoints(layer);

describe('ridgeHeightAt', () => {
  it('bate com os pontos e interpola entre eles', () => {
    expect(ridgeHeightAt(points, points[10][0])).toBeCloseTo(points[10][1]);
    const mid = (points[10][0] + points[11][0]) / 2;
    expect(ridgeHeightAt(points, mid)).toBeCloseTo((points[10][1] + points[11][1]) / 2);
  });

  it('prende nas bordas', () => {
    expect(ridgeHeightAt(points, -999)).toBe(points[0][1]);
    expect(ridgeHeightAt(points, 999)).toBe(points[points.length - 1][1]);
  });
});

describe('ridgeProfile', () => {
  it('normaliza entre 0 e 1 e guarda o intervalo', () => {
    const { values, min, max } = ridgeProfile(points);
    expect(Math.min(...values)).toBe(0);
    expect(Math.max(...values)).toBe(1);
    values.forEach((v, i) => expect(min + v * (max - min)).toBeCloseTo(points[i][1]));
  });
});

describe('forestPlacements', () => {
  const opts = { seed: 7, count: 60, halfWidth: 70, valleyHalf: 14 };

  it('é determinístico e respeita a quantidade', () => {
    const a = forestPlacements(points, opts);
    expect(a).toHaveLength(60);
    expect(forestPlacements(points, opts)).toEqual(a);
  });

  it('deixa o vale da câmera livre e planta abaixo do cume', () => {
    forestPlacements(points, opts).forEach(([x, y, s]) => {
      expect(Math.abs(x)).toBeGreaterThanOrEqual(14);
      expect(Math.abs(x)).toBeLessThanOrEqual(70);
      expect(y).toBeLessThan(ridgeHeightAt(points, x));
      expect(s).toBeGreaterThanOrEqual(1.4);
      expect(s).toBeLessThanOrEqual(3);
    });
  });
});

describe('kasumiBands', () => {
  const layers = [0, 1, 2, 3].map((i) => ({ z: 4 - i * 11, baseHeight: 0, amplitude: 8 }));

  it('uma faixa entre cada par de camadas, entre elas em z', () => {
    const bands = kasumiBands(layers, { seed: 3 });
    expect(bands).toHaveLength(3);
    bands.forEach((b, i) => {
      expect(b.z).toBeLessThan(layers[i].z);
      expect(b.z).toBeGreaterThan(layers[i + 1].z);
    });
  });

  it('`every` pula faixas (qualidade baixa)', () => {
    expect(kasumiBands(layers, { seed: 3, every: 2 })).toHaveLength(2);
  });
});

describe('flockX', () => {
  const cfg = { cycle: 20, flight: 10, span: 50 };

  it('cruza de -span a +span durante o voo', () => {
    expect(flockX(0, cfg)).toBe(-50);
    expect(flockX(5, cfg)).toBe(0);
    expect(flockX(10, cfg)).toBe(50);
  });

  it('some fora do voo e antes do atraso, e repete a cada ciclo', () => {
    expect(flockX(15, cfg)).toBeNull();
    expect(flockX(1, { ...cfg, delay: 3 })).toBeNull();
    expect(flockX(25, cfg)).toBe(0);
  });
});

describe('flockFormation', () => {
  it('o líder vai na frente e os outros ficam para trás', () => {
    const birds = flockFormation(7, { seed: 1 });
    expect(birds).toHaveLength(7);
    birds.slice(1).forEach(([x]) => expect(x).toBeLessThan(birds[0][0] + 0.3));
  });
});
