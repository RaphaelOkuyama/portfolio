import { describe, it, expect } from 'vitest';
import { ridgeY, cedarPath, cedarsOnRidge, riverPath } from '../../src/lib/journey/backdrop';

const RIDGE = [[0, 100], [100, 50], [200, 80]];

describe('ridgeY', () => {
  it('interpola entre os pontos e trava nas pontas', () => {
    expect(ridgeY(RIDGE, 50)).toBe(75);
    expect(ridgeY(RIDGE, 150)).toBe(65);
    expect(ridgeY(RIDGE, -10)).toBe(100);
    expect(ridgeY(RIDGE, 999)).toBe(80);
  });
});

describe('cedarsOnRidge', () => {
  const opts = { seed: 3, points: RIDGE, count: 20, minHeight: 10, maxHeight: 20 };

  it('é determinístico e respeita alturas', () => {
    const a = cedarsOnRidge(opts);
    expect(a).toEqual(cedarsOnRidge(opts));
    expect(a).toHaveLength(20);
    a.forEach((t) => {
      expect(t.h).toBeGreaterThanOrEqual(10);
      expect(t.h).toBeLessThanOrEqual(20);
    });
  });

  it('pousa as árvores na crista (com afundamento) e evita o vale', () => {
    const trees = cedarsOnRidge({ ...opts, avoid: [80, 120], sink: 4 });
    trees.forEach((t) => {
      expect(t.x < 80 || t.x > 120).toBe(true);
      expect(t.y).toBeCloseTo(ridgeY(RIDGE, t.x) + 4, 6);
    });
  });
});

describe('cedarPath', () => {
  it('desenha tronco e três andares de copa', () => {
    expect(cedarPath(50, 100, 40).match(/M/g)).toHaveLength(4);
  });
});

describe('riverPath', () => {
  it('fecha o contorno, nasce estreito e alarga até a base', () => {
    const d = riverPath({ topX: 100, topY: 0, bottomY: 100, topWidth: 10, bottomWidth: 90, sway: 0, seed: 1, steps: 4 });
    expect(d.endsWith('Z')).toBe(true);
    const pts = d.slice(1, -2).split(' L').map((p) => p.split(',').map(Number));
    // 5 pontos na margem esquerda, 5 na direita (de volta)
    expect(pts).toHaveLength(10);
    expect(pts[5][0] - pts[4][0]).toBeCloseTo(90);
    expect(pts[9][0] - pts[0][0]).toBeCloseTo(10);
  });
});
