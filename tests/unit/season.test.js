import { describe, it, expect } from 'vitest';
import {
  clamp01, seasonMixFromProgress, seasonNameFromMix, lerpHex, sampleSeason, FROZEN_PROGRESS,
} from '../../src/lib/journey/season';
import { SEASONS } from '../../src/lib/palette';

describe('clamp01', () => {
  it.each([[-1, 0], [0.4, 0.4], [2, 1]])('%s → %s', (v, e) => expect(clamp01(v)).toBe(e));
});

describe('seasonMixFromProgress', () => {
  it('mapeia 0–1 em 0–3 e limita fora da faixa', () => {
    expect(seasonMixFromProgress(0)).toBe(0);
    expect(seasonMixFromProgress(0.5)).toBe(1.5);
    expect(seasonMixFromProgress(1)).toBe(3);
    expect(seasonMixFromProgress(-0.2)).toBe(0);
    expect(seasonMixFromProgress(1.3)).toBe(3);
  });

  it('progresso congelado cai no outono', () => {
    expect(seasonNameFromMix(seasonMixFromProgress(FROZEN_PROGRESS))).toBe('autumn');
  });
});

describe('seasonNameFromMix', () => {
  it.each([[0, 'spring'], [0.6, 'summer'], [1.4, 'summer'], [2.2, 'autumn'], [3, 'winter']])(
    '%s → %s', (mix, name) => expect(seasonNameFromMix(mix)).toBe(name),
  );
});

describe('lerpHex', () => {
  it('interpola canal a canal e arredonda', () => {
    expect(lerpHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(lerpHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(lerpHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(lerpHex('#ff0000', '#0000ff', 0.25)).toBe('#bf0040');
  });
});

describe('sampleSeason', () => {
  const seasons = SEASONS.night;

  it('mix inteiro devolve a estação exata', () => {
    expect(sampleSeason(seasons, 0)).toEqual(seasons[0]);
    expect(sampleSeason(seasons, 2)).toEqual(seasons[2]);
    expect(sampleSeason(seasons, 3)).toEqual(seasons[3]);
  });

  it('mix fracionário interpola entre estações vizinhas', () => {
    const mid = sampleSeason(seasons, 0.5);
    expect(mid.sky).toBe(lerpHex(seasons[0].sky, seasons[1].sky, 0.5));
    expect(mid.mountains[2]).toBe(lerpHex(seasons[0].mountains[2], seasons[1].mountains[2], 0.5));
  });

  it('limita mix fora da faixa', () => {
    expect(sampleSeason(seasons, -1)).toEqual(seasons[0]);
    expect(sampleSeason(seasons, 9)).toEqual(seasons[3]);
  });
});
