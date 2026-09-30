import { describe, it, expect } from 'vitest';
import { toNdc } from '../../src/lib/pointer';

describe('toNdc', () => {
  it.each([
    [[0, 0, 800, 600], { x: -1, y: 1 }],
    [[800, 600, 800, 600], { x: 1, y: -1 }],
    [[400, 300, 800, 600], { x: 0, y: 0 }],
    [[200, 450, 800, 600], { x: -0.5, y: -0.5 }],
  ])('%j → %o', (args, expected) => {
    const r = toNdc(...args);
    expect(r.x).toBeCloseTo(expected.x, 6);
    expect(r.y).toBeCloseTo(expected.y, 6);
  });
});
