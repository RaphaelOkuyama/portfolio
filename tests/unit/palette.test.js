import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { THEMES, SEASONS, SCENE_ACCENTS, normalizeTheme } from '../../src/lib/palette';

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

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('contraste da cena (AA)', () => {
  it.each(['night', 'day'])('tons de %s têm contraste >= 4.5 com o texto', (theme) => {
    const text = THEMES[theme].textPrimary;
    SEASONS[theme].forEach((s, i) => {
      for (const tone of [s.sky, s.fog, ...s.mountains]) {
        expect(contrastRatio(tone, text), `${theme}[${i}] ${tone}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  it.each(['night', 'day'])('montanha próxima destaca do céu em %s (>= 1.25)', (theme) => {
    SEASONS[theme].forEach((s, i) => {
      expect(contrastRatio(s.mountains[0], s.sky), `${theme}[${i}]`).toBeGreaterThanOrEqual(1.25);
    });
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

describe('SCENE_ACCENTS', () => {
  it('os dois temas têm pétala, torii, topo do torii, astro e o iwakura em hex', () => {
    for (const theme of ['night', 'day']) {
      expect(Object.keys(SCENE_ACCENTS[theme]).sort()).toEqual(['celestial', 'firefly', 'iwakura', 'lantern', 'momiji', 'petal', 'sand', 'shide', 'shimenawa', 'snow', 'stone', 'torii', 'toriiTop', 'water']);
      Object.values(SCENE_ACCENTS[theme]).forEach((c) => expect(c).toMatch(HEX));
    }
  });
});
