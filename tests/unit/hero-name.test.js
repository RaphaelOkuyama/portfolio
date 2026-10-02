import { describe, it, expect } from 'vitest';
import { buildNameSequence, SCRAMBLE_CHARS, NAME_HOLD_SECONDS, NAME_SCRAMBLE_SECONDS } from '../../src/lib/hero/name';
import { profile } from '../../src/data/resume';

describe('buildNameSequence', () => {
  it('cicla hiragana → katakana, sem passar pelo latino', () => {
    expect(buildNameSequence(profile)).toEqual([
      'らふぁえる のぶゆき はが おくやま',
      'ラファエル ノブユキ ハガ オクヤマ',
    ]);
  });
});

describe('constantes', () => {
  it('tempos do ciclo', () => {
    expect(NAME_HOLD_SECONDS).toBe(3.5);
    expect(NAME_SCRAMBLE_SECONDS).toBe(1.4);
  });

  it('caracteres do scramble são só katakana de meia largura', () => {
    expect(SCRAMBLE_CHARS.length).toBeGreaterThan(20);
    expect(SCRAMBLE_CHARS).toMatch(/^[ｦ-ﾝ]+$/);
  });
});
