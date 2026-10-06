import { describe, it, expect } from 'vitest';
import { branchFor, tanzakuLayout } from '../../src/lib/journey/tanabata';

const bamboos = [
  { x: -3.8, y: 0.8, z: -15, side: -1, height: 9.5 },
  { x: 3.8, y: 0.8, z: -15, side: 1, height: 9.5 },
];

describe('七夕: tiras nos bambus', () => {
  it('as 6 áreas se dividem entre os dois bambus, três galhos em alturas diferentes', () => {
    const branches = Array.from({ length: 6 }, (_, i) => branchFor(i));
    expect(branches.filter((b) => b.bamboo === 0)).toHaveLength(3);
    expect(new Set(branches.map((b) => `${b.bamboo}:${b.height}`)).size).toBe(6);
  });

  it('uma tira por ferramenta, sempre para fora do caminho (onde a câmera passa)', () => {
    const counts = [5, 9, 8, 5, 12, 6];
    const strips = tanzakuLayout(counts, bamboos);
    expect(strips).toHaveLength(45);
    strips.forEach((s) => expect(Math.abs(s.x)).toBeGreaterThan(3.7));
    // Cada área num galho só: todas as tiras dela do mesmo lado
    for (let a = 0; a < counts.length; a += 1) {
      const sides = new Set(strips.filter((s) => s.area === a).map((s) => Math.sign(s.x)));
      expect(sides.size).toBe(1);
    }
  });

  it('as tiras ficam acima da altura da câmera menos um pouco, sem encostar no chão', () => {
    const strips = tanzakuLayout([5, 9, 8, 5, 12, 6], bamboos);
    strips.forEach((s) => expect(s.y).toBeGreaterThan(bamboos[0].y + 2.5));
  });
});
