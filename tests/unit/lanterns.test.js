import { describe, it, expect } from 'vitest';
import { currentSpeed, flicker, laneLayout, lanternLabel, labelLayout } from '../../src/lib/journey/lanterns';
import { mulberry32 } from '../../src/lib/journey/ridge';

describe('flicker', () => {
  it('fica entre o mínimo e 1 e varia com o tempo', () => {
    const values = Array.from({ length: 400 }, (_, i) => flicker(i * 0.05, 1.3));
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0.72 - 1e-9);
      expect(v).toBeLessThanOrEqual(1 + 1e-9);
    });
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.1);
  });
});

describe('laneLayout', () => {
  const lane = { laneX: [-15, 15], laneZ: [-22, 50], viewZ: 56, spread: 0.55 };

  it('espalha dentro da faixa, do perto ao longe', () => {
    const items = laneLayout(20, lane, mulberry32(3));
    expect(items).toHaveLength(20);
    items.forEach(({ x, z }) => {
      expect(x).toBeGreaterThanOrEqual(-15);
      expect(x).toBeLessThanOrEqual(15);
      expect(z).toBeGreaterThanOrEqual(-22);
      expect(z).toBeLessThanOrEqual(50);
    });
    const zs = items.map((l) => l.z);
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(55);
  });

  it('perto da câmera fica dentro do quadro (estreito); longe abre', () => {
    laneLayout(20, lane, mulberry32(3)).forEach(({ x, z }) => {
      expect(Math.abs(x)).toBeLessThanOrEqual(Math.max(1, 56 - z) * 0.55 + 1e-9);
    });
  });

  it('é determinístico com a mesma semente', () => {
    expect(laneLayout(10, lane, mulberry32(9))).toEqual(laneLayout(10, lane, mulberry32(9)));
  });
});

describe('currentSpeed', () => {
  it('lenta perto da câmera, plena ao longe, crescendo no meio', () => {
    expect(currentSpeed(1, 55, 56)).toBeCloseTo(0.25);
    expect(currentSpeed(1, -20, 56)).toBeCloseTo(1);
    const mid = currentSpeed(1, 36, 56);
    expect(mid).toBeGreaterThan(0.25);
    expect(mid).toBeLessThan(1);
  });
});

describe('lanternLabel', () => {
  it('pega só o primeiro nome, sem símbolos, até 10 letras', () => {
    expect(lanternLabel('  Ana Maria Souza ')).toBe('Ana');
    expect(lanternLabel('<script>alert(1)</script>')).toBe('scriptaler');
    expect(lanternLabel('Maximiliano')).toHaveLength(10);
    expect(lanternLabel("D'Ávila")).toBe("D'Ávila");
  });

  it('aceita japonês e vazio', () => {
    expect(lanternLabel('奥山 芳賀')).toBe('奥山');
    expect(lanternLabel('')).toBe('');
    expect(lanternLabel(undefined)).toBe('');
  });
});

describe('labelLayout', () => {
  it('vertical até 5 letras, horizontal acima', () => {
    expect(labelLayout('Ana').mode).toBe('vertical');
    expect(labelLayout('Raphael').mode).toBe('horizontal');
  });
});
