import { describe, it, expect } from 'vitest';
import { buildVCard, escapeVCard } from '../../src/lib/meishi';
import { MICROSEASONS, microseasonFor, tokyoMonthDay } from '../../src/lib/microseasons';
import { drawOmikuji, RANKS, CATEGORIES } from '../../src/lib/omikuji';
import { kanjiNumeral, kanjiNumber, KANJI_NUMBERS } from '../../src/lib/kanji';
import { SHODO_STROKES, SHODO_STROKE_COUNT } from '../../src/lib/shodo';

describe('名刺 vCard', () => {
  it('escapa os caracteres especiais do vCard', () => {
    // String.raw: as barras do vCard ficam literais no teste
    expect(escapeVCard(`${String.raw`a,b;c\d`}\ne`)).toBe(String.raw`a\,b\;c\\d\ne`);
  });

  it('monta um vCard 3.0 com nome em partes, cargo, e-mail e perfis', () => {
    const lines = buildVCard({ title: 'Desenvolvedor Full-Stack' }).split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCARD');
    expect(lines).toContain('VERSION:3.0');
    expect(lines).toContain('N:Okuyama;Raphael;Nobuyuki Haga;;');
    expect(lines).toContain('FN:Raphael Nobuyuki Haga Okuyama');
    expect(lines).toContain('TITLE:Desenvolvedor Full-Stack');
    expect(lines).toContain('EMAIL;TYPE=INTERNET:raphaelokuyama123@gmail.com');
    expect(lines.some((l) => l.startsWith('X-SOCIALPROFILE;TYPE=linkedin:'))).toBe(true);
    expect(lines.at(-1)).toBe('END:VCARD');
  });
});

describe('七十二候', () => {
  it('são 72, com início em ordem a partir de 立春 (4/2)', () => {
    expect(MICROSEASONS).toHaveLength(72);
    expect(MICROSEASONS[0]).toMatchObject({ month: 2, day: 4, kanji: '東風解凍' });
    const keys = MICROSEASONS.map((s) => (s.month < 2 ? s.month + 12 : s.month) * 100 + s.day);
    expect([...keys].sort((a, b) => a - b)).toEqual(keys);
  });

  it('usa a data de Tóquio, não a do visitante', () => {
    expect(tokyoMonthDay(new Date('2026-10-02T16:00:00Z'))).toEqual({ month: 10, day: 3 });
  });

  it.each([
    ['2026-10-02T12:00:00Z', '蟄虫坏戸'],
    ['2026-10-03T03:00:00Z', '水始涸'],
    ['2026-03-26T03:00:00Z', '櫻始開'],
    ['2026-12-31T03:00:00Z', '雪下出麦'],
    // Antes de 5/1 o ano ainda está na última do ano anterior
    ['2027-01-02T03:00:00Z', '雪下出麦'],
    ['2027-01-05T03:00:00Z', '芹乃栄'],
  ])('%s → %s', (iso, kanji) => {
    expect(microseasonFor(new Date(iso)).kanji).toBe(kanji);
  });
});

describe('おみくじ', () => {
  const seq = (...values) => () => values.shift();

  it('o sorteio respeita os pesos: começo da tabela é 大吉, fim é 凶', () => {
    expect(drawOmikuji(seq(0, 0.5)).rank.kanji).toBe('大吉');
    const bad = drawOmikuji(seq(0.999, 0.5));
    expect(bad.rank.kanji).toBe('凶');
    expect(bad.unlucky).toBe(true);
  });

  it('traz número da vareta (também em kanji) e uma frase por categoria nos dois idiomas', () => {
    const f = drawOmikuji(seq(0.3, 0.46));
    expect(f.number).toBe(47);
    expect(f.numberKanji).toBe('四十七');
    expect(f.lines.map((l) => l.kanji)).toEqual(CATEGORIES.map((c) => c.kanji));
    f.lines.forEach((l) => {
      expect(l.text.pt).toBeTruthy();
      expect(l.text.en).toBeTruthy();
    });
  });

  it('todo grau é sorteável', () => {
    const seen = new Set();
    for (let i = 0; i < 100; i += 1) seen.add(drawOmikuji(seq(i / 100, 0)).rank.kanji);
    expect([...seen].sort()).toEqual(RANKS.map((r) => r.kanji).sort());
  });
});

describe('numerais em kanji', () => {
  it.each([[1, '一'], [10, '十'], [11, '十一'], [20, '二十'], [47, '四十七'], [99, '九十九'], [100, '百']])('%i → %s', (n, k) => {
    expect(kanjiNumeral(n)).toBe(k);
  });

  it('fora de 1 a 100 cai no número comum', () => {
    expect(kanjiNumeral(0)).toBe('0');
    expect(kanjiNumeral(101)).toBe('101');
  });

  it('kanjiNumber conta a partir do índice 0 e a lista dos painéis vai até 二十', () => {
    expect(kanjiNumber(0)).toBe('一');
    expect(KANJI_NUMBERS).toHaveLength(20);
    expect(KANJI_NUMBERS.at(-1)).toBe('二十');
  });
});

describe('書道', () => {
  it('奥 tem 12 traços e 山 tem 3, todos caminhos SVG', () => {
    expect(SHODO_STROKES.奥).toHaveLength(12);
    expect(SHODO_STROKES.山).toHaveLength(3);
    expect(SHODO_STROKE_COUNT).toBe(15);
    [...SHODO_STROKES.奥, ...SHODO_STROKES.山].forEach((d) => expect(d).toMatch(/^M[\d.]+,[\d.]+[cC]/));
  });
});
