import { describe, it, expect } from 'vitest';
import { mulberry32, ridgePoints } from '../../src/lib/journey/ridge';

const base = { seed: 42, width: 100, segments: 50, baseHeight: 2, amplitude: 10 };

describe('mulberry32', () => {
  it('é determinístico e fica em [0, 1)', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('ridgePoints', () => {
  it('gera segments + 1 pontos cobrindo a largura', () => {
    const pts = ridgePoints(base);
    expect(pts).toHaveLength(51);
    expect(pts[0][0]).toBe(-50);
    expect(pts[50][0]).toBe(50);
  });

  it('mesma seed, mesmo relevo; seed diferente, relevo diferente', () => {
    expect(ridgePoints(base)).toEqual(ridgePoints(base));
    expect(ridgePoints({ ...base, seed: 43 })).not.toEqual(ridgePoints(base));
  });

  it('altura fica entre baseHeight e baseHeight + 1.63 * amplitude', () => {
    for (const [, y] of ridgePoints(base)) {
      expect(y).toBeGreaterThanOrEqual(2);
      expect(y).toBeLessThanOrEqual(2 + 1.63 * 10 + 1e-9);
    }
  });

  it('o vale rebaixa o relevo perto do centro', () => {
    const flat = ridgePoints(base);
    const valley = ridgePoints({ ...base, valleyCenter: 0, valleyDepth: 0.8, valleyWidth: 6 });
    const center = 25; // x = 0
    const relief = (pts, i) => pts[i][1] - base.baseHeight;
    expect(relief(valley, center)).toBeCloseTo(relief(flat, center) * 0.2, 6);
    expect(relief(valley, 0)).toBeCloseTo(relief(flat, 0), 3); // borda quase intacta
  });
});
