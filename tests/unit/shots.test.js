import { describe, it, expect } from 'vitest';
import { cameraShot, HERO_SHOT, inkBreath, SECTION_SHOTS } from '../../src/lib/journey/shots';

describe('planos de câmera', () => {
  it('no hero das telas deitadas o torii vai para o terço direito (giro fixo)', () => {
    const wide = cameraShot(0, { crossAt: 0.15, aspect: 16 / 9 });
    expect(wide.yaw).toBeCloseTo(HERO_SHOT.yaw);
    expect(cameraShot(0, { crossAt: 0.15, aspect: 21 / 9 }).yaw).toBeCloseTo(HERO_SHOT.yaw);
  });

  it('em pé não gira', () => {
    expect(cameraShot(0, { crossAt: 0.15, aspect: 0.46 }).yaw).toBe(0);
  });

  it('volta ao centro antes de cruzar o torii', () => {
    const before = cameraShot(0.06, { crossAt: 0.15, aspect: 1.6 }).yaw;
    expect(before).toBeGreaterThan(0);
    expect(before).toBeLessThan(HERO_SHOT.yaw);
    expect(cameraShot(0.12, { crossAt: 0.15, aspect: 1.6 }).yaw).toBe(0);
    expect(cameraShot(0.5, { crossAt: 0.15, aspect: 1.6 }).yaw).toBe(0);
  });

  it('cada seção tem o seu plano, que entra e sai suave', () => {
    const ranges = { about: [0.1, 0.26], stack: [0.26, 0.4] };
    const mid = cameraShot(0.33, { crossAt: 0.15, aspect: 1.6, ranges });
    expect(mid.pitch).toBeLessThan(0);
    // Longe de qualquer seção com plano, nada gira
    expect(cameraShot(0.95, { crossAt: 0.15, aspect: 1.6, ranges }).yaw).toBe(0);
    expect(SECTION_SHOTS.projects.from.yaw).toBeGreaterThan(SECTION_SHOTS.projects.to.yaw);
  });

  it('o respiro de nanquim acende só na virada de capítulo', () => {
    const ranges = { about: [0.1, 0.26], stack: [0.26, 0.4] };
    expect(inkBreath(0.26, ranges)).toBeCloseTo(1);
    expect(inkBreath(0.33, ranges)).toBe(0);
  });
});
