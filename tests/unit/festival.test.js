import { describe, it, expect } from 'vitest';
import { maskGeometry, maskStallGeometry, maskTexture, STALL_MASKS } from '../../src/components/scene/festivalGeometry';

describe('祭り: máscaras da barraca', () => {
  it('cada máscara tem UV (a pintura vem do atlas) e cor nos vértices, em cache', () => {
    for (const kind of ['tengu', 'kitsune', 'oni', 'okame', 'hyottoko']) {
      const g = maskGeometry(kind);
      expect(g.attributes.uv.count).toBe(g.attributes.position.count);
      expect(g.attributes.color).toBeTruthy();
      expect(maskGeometry(kind)).toBe(g);
    }
  });

  it('o atlas é uma textura gerada em código, potência de 2, com a pintura (não só branco)', () => {
    const tex = maskTexture();
    const { width, height, data } = tex.image;
    expect(Math.log2(width) % 1).toBe(0);
    expect(Math.log2(height) % 1).toBe(0);
    // A bochecha do tengu (ladrilho 0) é vermelha
    const i = ((90 * width) + 192) * 4;
    expect(data[i]).toBeGreaterThan(data[i + 1] + 60);
  });

  it('as máscaras da barraca ficam no painel, entre os postes', () => {
    maskStallGeometry();
    for (const [, x, y] of STALL_MASKS) {
      expect(Math.abs(x)).toBeLessThan(1.4);
      expect(y).toBeGreaterThan(1.2);
      expect(y).toBeLessThan(2.6);
    }
  });
});
