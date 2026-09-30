import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { THEMES, SEASONS, normalizeTheme } from '../../src/lib/palette';

const HEX = /^#[0-9a-f]{6}$/;
const css = readFileSync(new URL('../../src/app/globals.css', import.meta.url), 'utf8');

// Lê as variáveis CSS do primeiro bloco cujo seletor contém `selector`
function cssVars(selector) {
  const start = css.indexOf(selector);
  const block = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const kebab = (key) => key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

describe('THEMES', () => {
  it('os dois temas têm as mesmas chaves, todas em hex', () => {
    expect(Object.keys(THEMES.day).sort()).toEqual(Object.keys(THEMES.night).sort());
    for (const tokens of Object.values(THEMES)) {
      for (const value of Object.values(tokens)) expect(value).toMatch(HEX);
    }
  });

  it.each([
    ['night', "[data-theme='night']"],
    ['day', "[data-theme='day']"],
  ])('globals.css espelha THEMES.%s', (name, selector) => {
    const vars = cssVars(selector);
    for (const [key, value] of Object.entries(THEMES[name])) {
      expect(vars[kebab(key)], `--${kebab(key)}`).toBe(value);
    }
  });
});

describe('SEASONS', () => {
  it('cada tema tem 4 estações com céu, névoa e 3 tons de montanha', () => {
    for (const seasons of Object.values(SEASONS)) {
      expect(seasons).toHaveLength(4);
      for (const s of seasons) {
        expect(s.sky).toMatch(HEX);
        expect(s.fog).toMatch(HEX);
        expect(s.mountains).toHaveLength(3);
        s.mountains.forEach((c) => expect(c).toMatch(HEX));
      }
    }
  });
});

describe('normalizeTheme', () => {
  it.each([
    ['day', 'day'],
    ['light', 'day'],
    ['night', 'night'],
    ['dark', 'night'],
    [null, 'night'],
    ['qualquer', 'night'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeTheme(input)).toBe(expected);
  });
});
