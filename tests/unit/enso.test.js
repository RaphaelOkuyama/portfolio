import { describe, it, expect } from 'vitest';
import { ENSO, brushWidth, brushCenter, ensoShapes } from '../../src/lib/enso';

describe('brushWidth', () => {
  it('carrega tinta no começo e afina até o fim', () => {
    const start = brushWidth(0.1);
    const end = brushWidth(1);
    expect(start).toBeGreaterThan(ENSO.maxWidth * 0.8);
    expect(end).toBeLessThan(ENSO.maxWidth * 0.25);
    expect(brushWidth(0.5)).toBeLessThan(start);
  });
});

describe('brushCenter', () => {
  it('fica perto do raio e deixa a abertura entre o fim e o começo', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      const { x, y } = brushCenter(t);
      const r = Math.hypot(x - ENSO.cx, y - ENSO.cy);
      expect(Math.abs(r - ENSO.radius)).toBeLessThan(ENSO.radius * 0.05);
    }
    const a = brushCenter(0);
    const b = brushCenter(1);
    // A máscara (traço largo) não pode revelar o fim enquanto pinta o começo
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(ENSO.maxWidth * 1.25);
  });
});

describe('ensoShapes', () => {
  it('é determinístico (mesmo SVG no servidor e no cliente)', () => {
    expect(ensoShapes()).toEqual(ensoShapes());
  });

  it('gera corpo fechado, cerdas e o guia da máscara dentro do viewBox', () => {
    const { core, bristles, guide } = ensoShapes();
    expect(core.startsWith('M')).toBe(true);
    expect(core.endsWith('Z')).toBe(true);
    expect(bristles.length).toBeGreaterThan(20);
    const numbers = [core, guide, ...bristles.map((b) => b.d)].join(' ').match(/-?\d+(\.\d+)?/g).map(Number);
    numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(220);
    });
  });

  it('o pincel seca: algumas cerdas falham (mais de um segmento)', () => {
    const broken = ensoShapes().bristles.filter((b) => (b.d.match(/M/g) || []).length > 1);
    expect(broken.length).toBeGreaterThan(5);
  });
});
