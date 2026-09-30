import { describe, it, expect } from 'vitest';
import { pruneTrail, trailWidth, TRAIL_TTL_MS } from '../../src/lib/cursor/trail';

describe('pruneTrail', () => {
  it('remove pontos mais velhos que o TTL e mantém a ordem', () => {
    const points = [{ x: 0, y: 0, t: 0 }, { x: 1, y: 1, t: 100 }, { x: 2, y: 2, t: 300 }];
    expect(TRAIL_TTL_MS).toBe(260);
    expect(pruneTrail(points, 300)).toEqual([{ x: 1, y: 1, t: 100 }, { x: 2, y: 2, t: 300 }]);
    expect(pruneTrail(points, 1000)).toEqual([]);
  });

  it('aceita TTL customizado', () => {
    expect(pruneTrail([{ x: 0, y: 0, t: 0 }], 50, 40)).toEqual([]);
  });
});

describe('trailWidth', () => {
  it('afina no fim do rastro e engrossa perto do ponteiro', () => {
    expect(trailWidth(0, 5, 10)).toBeCloseTo(1.5, 6);
    expect(trailWidth(4, 5, 10)).toBeCloseTo(10, 6);
    expect(trailWidth(2, 5, 10)).toBeCloseTo(5.75, 6);
  });

  it('rastro de um ponto usa a espessura máxima', () => {
    expect(trailWidth(0, 1, 10)).toBe(10);
  });
});
