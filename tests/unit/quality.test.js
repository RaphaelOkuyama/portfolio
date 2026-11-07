import { describe, it, expect } from 'vitest';
import {
  DEFAULT_QUALITY, QUALITY_KEY, QUALITY_LEVELS, QUALITY_SETTINGS, autoQuality, readQuality, readSavedQuality, saveQuality, stepDown,
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

describe('qualidade automática pela placa de vídeo', () => {
  it('dedicadas e Apple Silicon no desktop vão para o alto', () => {
    expect(autoQuality('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU (0x00002560) Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('high');
    expect(autoQuality('ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('high');
    expect(autoQuality('ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)')).toBe('high');
    expect(autoQuality('ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('high');
  });

  it('integradas boas e celulares fortes ficam no médio', () => {
    expect(autoQuality('ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('medium');
    expect(autoQuality('ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('medium');
    expect(autoQuality('Apple GPU', { mobile: true })).toBe('medium');
    expect(autoQuality('Adreno (TM) 730', { mobile: true })).toBe('medium');
    expect(autoQuality('Mali-G715-Immortalis MC11', { mobile: true })).toBe('medium');
    expect(autoQuality('ANGLE (NVIDIA, NVIDIA GeForce RTX 4060)', { mobile: true })).toBe('medium');
  });

  it('fracas, por software ou desconhecidas ficam no mínimo', () => {
    expect(autoQuality('ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('low');
    expect(autoQuality('Adreno (TM) 610', { mobile: true })).toBe('low');
    expect(autoQuality('Mali-G57 MC2', { mobile: true })).toBe('low');
    expect(autoQuality('NVIDIA Tegra X1')).toBe('low');
    expect(autoQuality('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)')).toBe('low');
    expect(autoQuality('')).toBe('low');
    expect(autoQuality(undefined)).toBe('low');
  });

  it('a escolha salva só vale se for um nível válido', () => {
    expect(readSavedQuality(memory())).toBe(null);
    expect(readSavedQuality(memory({ [QUALITY_KEY]: 'medium' }))).toBe('medium');
    expect(readSavedQuality(memory({ [QUALITY_KEY]: 'ultra' }))).toBe(null);
    expect(readSavedQuality({ getItem: () => { throw new Error('bloqueado'); } })).toBe(null);
  });
});
