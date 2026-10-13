import { describe, it, expect } from 'vitest';
import { CROW_HINTS, crowHint } from '../../src/lib/crow';

describe('八咫烏: as dicas do corvo', () => {
  it('uma dica por clique, em ordem, voltando ao começo', () => {
    const n = CROW_HINTS.pt.length;
    expect(crowHint('pt', 0)).toBe(CROW_HINTS.pt[0]);
    expect(crowHint('pt', 1)).toBe(CROW_HINTS.pt[1]);
    expect(crowHint('pt', n)).toBe(CROW_HINTS.pt[0]);
  });

  it('as mesmas dicas em inglês, e português quando o idioma é desconhecido', () => {
    expect(CROW_HINTS.en).toHaveLength(CROW_HINTS.pt.length);
    expect(crowHint('en', 2)).toBe(CROW_HINTS.en[2]);
    expect(crowHint('xx', 2)).toBe(CROW_HINTS.pt[2]);
  });
});
