import { describe, it, expect } from 'vitest';
import { profileHeight, groundHeight } from '../../src/lib/journey/ground';
import { GROUND, CAMERA_PATH, RIVER } from '../../src/components/scene/config';

const PROFILE = [[10, 0], [0, 2], [-10, 2]];

describe('profileHeight', () => {
  it('passa pelos pontos e trava nas pontas', () => {
    expect(profileHeight(20, PROFILE)).toBe(0);
    expect(profileHeight(10, PROFILE)).toBe(0);
    expect(profileHeight(0, PROFILE)).toBe(2);
    expect(profileHeight(-30, PROFILE)).toBe(2);
  });

  it('suaviza entre os pontos (meio do caminho = média)', () => {
    expect(profileHeight(5, PROFILE)).toBeCloseTo(1, 6);
    expect(profileHeight(9, PROFILE)).toBeLessThan(0.1);
  });
});

describe('groundHeight', () => {
  const cfg = { profile: PROFILE, flatHalf: 5, bowl: 0.1, bowlMax: 3 };

  it('é plano no meio do vale e sobe em concha nas laterais', () => {
    expect(groundHeight(0, 0, cfg)).toBe(2);
    expect(groundHeight(5, 0, cfg)).toBe(2);
    expect(groundHeight(-7, 0, cfg)).toBeCloseTo(2 + 0.1 * 4, 6);
    expect(groundHeight(100, 0, cfg)).toBe(5);
  });
});

describe('chão da cena', () => {
  it('fica sempre abaixo da câmera ao longo do caminho', () => {
    CAMERA_PATH.forEach(([x, y, z]) => {
      expect(groundHeight(x, z, GROUND)).toBeLessThan(y - 0.8);
    });
  });

  it('desce abaixo da água na margem do rio', () => {
    const riverY = CAMERA_PATH[CAMERA_PATH.length - 1][1] - RIVER.drop;
    expect(groundHeight(0, -52, GROUND)).toBeLessThan(riverY);
  });
});
