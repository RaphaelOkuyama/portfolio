import { describe, it, expect } from 'vitest';
import { celestialAt, sunsetGlow, transitionPhase, SUNSET } from '../../src/lib/journey/skyTransition';

describe('日の入り: troca de tema como pôr do sol', () => {
  const t = { start: 10, from: 'day', to: 'night' };

  it('a fase vai de 0 a 1 só durante a transição', () => {
    expect(transitionPhase(9, t)).toBeNull();
    expect(transitionPhase(10, t)).toBe(0);
    expect(transitionPhase(10 + SUNSET.duration / 2, t)).toBeCloseTo(0.5);
    expect(transitionPhase(10 + SUNSET.duration + 0.1, t)).toBeNull();
  });

  it('o céu de pôr do sol tem o auge no meio e some nas pontas', () => {
    expect(sunsetGlow(null)).toBe(0);
    expect(sunsetGlow(0)).toBeCloseTo(0);
    expect(sunsetGlow(0.5)).toBeCloseTo(1);
    expect(sunsetGlow(1)).toBeCloseTo(0);
  });

  it('o sol desce na primeira metade e a lua sobe na segunda', () => {
    expect(celestialAt(0, t)).toEqual({ theme: 'day', sink: 0, setting: true });
    expect(celestialAt(0.49, t).theme).toBe('day');
    expect(celestialAt(0.49, t).sink).toBeGreaterThan(0.95);
    expect(celestialAt(0.5, t)).toEqual({ theme: 'night', sink: 1, setting: false });
    expect(celestialAt(1, t).sink).toBeCloseTo(0);
    expect(celestialAt(null, t)).toBeNull();
  });
});
