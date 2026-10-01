import { describe, it, expect } from 'vitest';
import { KONAMI, createKonamiMatcher, createClickCounter } from '../../src/lib/easterEgg';

describe('createKonamiMatcher', () => {
  it('dispara só ao completar a sequência', () => {
    const match = createKonamiMatcher();
    const results = KONAMI.map((k) => match(k));
    expect(results.slice(0, -1).every((r) => r === false)).toBe(true);
    expect(results.at(-1)).toBe(true);
  });

  it('aceita B e A maiúsculos e recomeça depois de errar', () => {
    const match = createKonamiMatcher();
    ['ArrowUp', 'x'].forEach(match);
    const results = KONAMI.map((k) => match(k.length === 1 ? k.toUpperCase() : k));
    expect(results.at(-1)).toBe(true);
  });

  it('tecla errada no meio zera, mas a primeira tecla certa já conta', () => {
    const match = createKonamiMatcher(['a', 'b', 'c']);
    expect(match('a')).toBe(false);
    expect(match('a')).toBe(false); // recomeça já com um 'a'
    expect(match('b')).toBe(false);
    expect(match('c')).toBe(true);
  });
});

describe('createClickCounter', () => {
  it('dispara no quinto clique dentro da janela e zera', () => {
    const click = createClickCounter(5, 2000);
    expect([0, 100, 200, 300].map(click).some(Boolean)).toBe(false);
    expect(click(400)).toBe(true);
    expect(click(500)).toBe(false);
  });

  it('cliques espaçados demais não contam', () => {
    const click = createClickCounter(3, 1000);
    expect(click(0)).toBe(false);
    expect(click(900)).toBe(false);
    expect(click(2500)).toBe(false);
  });
});
