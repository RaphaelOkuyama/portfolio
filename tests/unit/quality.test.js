import { describe, it, expect } from 'vitest';
import {
  DEFAULT_QUALITY, QUALITY_KEY, QUALITY_LEVELS, QUALITY_SETTINGS, readQuality, saveQuality, stepDown,
} from '../../src/lib/journey/quality';

const memory = (initial = {}) => {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; }, data };
};

describe('qualidade gráfica', () => {
  it('três níveis, do mínimo ao alto; o bloom só no alto', () => {
    expect(QUALITY_LEVELS).toEqual(['low', 'medium', 'high']);
    expect(QUALITY_SETTINGS.low.postprocessing).toBe(false);
    expect(QUALITY_SETTINGS.medium.postprocessing).toBe(false);
    expect(QUALITY_SETTINGS.high.postprocessing).toBe(true);
    expect(QUALITY_SETTINGS.low.particles).toBeLessThan(QUALITY_SETTINGS.medium.particles);
    expect(QUALITY_SETTINGS.medium.particles).toBeLessThan(QUALITY_SETTINGS.high.particles);
  });

  it('começa no mínimo; lê a escolha salva e ignora valores inválidos ou storage bloqueado', () => {
    expect(DEFAULT_QUALITY).toBe('low');
    expect(readQuality(memory())).toBe('low');
    expect(readQuality(memory({ [QUALITY_KEY]: 'high' }))).toBe('high');
    expect(readQuality(memory({ [QUALITY_KEY]: 'ultra' }))).toBe('low');
    expect(readQuality({ getItem: () => { throw new Error('bloqueado'); } })).toBe('low');
  });

  it('salva a escolha e, com o FPS caindo, desce um degrau por vez', () => {
    const storage = memory();
    saveQuality(storage, 'medium');
    expect(storage.data[QUALITY_KEY]).toBe('medium');
    expect(() => saveQuality({ setItem: () => { throw new Error('bloqueado'); } }, 'high')).not.toThrow();
    expect(stepDown('high')).toBe('medium');
    expect(stepDown('medium')).toBe('low');
    expect(stepDown('low')).toBe('low');
  });
});
