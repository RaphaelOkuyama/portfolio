import { describe, it, expect } from 'vitest';
import {
  monthsBetween, formatMonth, formatPeriod, formatDuration, orderTimeline, currentMonth,
} from '../../src/lib/experience';
import { resumeData } from '../../src/data/resume';

describe('monthsBetween', () => {
  it('conta o mês de início e o de fim', () => {
    expect(monthsBetween('2022-04', '2025-02')).toBe(35);
    expect(monthsBetween('2025-05', '2025-05')).toBe(1);
    expect(monthsBetween('2025-05', '2026-10')).toBe(18);
  });
});

describe('formatação', () => {
  it('mês e período nos dois idiomas', () => {
    expect(formatMonth('2025-05', 'pt')).toBe('Mai 2025');
    expect(formatMonth('2025-05', 'en')).toBe('May 2025');
    expect(formatPeriod('2022-04', '2025-02', 'pt', 'Atual')).toBe('Abr 2022 - Fev 2025');
    expect(formatPeriod('2025-02', null, 'en', 'Present')).toBe('Feb 2025 - Present');
  });

  it.each([
    [35, 'pt', '2 anos e 11 meses'],
    [12, 'pt', '1 ano'],
    [1, 'pt', '1 mês'],
    [18, 'pt', '1 ano e 6 meses'],
    [35, 'en', '2 yrs 11 mos'],
    [13, 'en', '1 yr 1 mo'],
  ])('%i meses (%s) → %s', (months, lang, text) => {
    expect(formatDuration(months, lang)).toBe(text);
  });

  it('mês atual no formato AAAA-MM', () => {
    expect(currentMonth(new Date(2026, 9, 2))).toBe('2026-10');
  });
});

describe('orderTimeline', () => {
  const entries = [
    { id: 'a', start: '2022-04', end: '2025-02' },
    { id: 'b', start: '2025-02', end: null },
    { id: 'c', start: '2025-05', end: null },
  ];

  it('ordena do mais recente para o mais antigo', () => {
    expect(orderTimeline(entries, '2026-10').map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });

  it('marca os cargos que correm ao mesmo tempo; quem só encosta na virada do mês não conta', () => {
    const byId = Object.fromEntries(orderTimeline(entries, '2026-10').map((e) => [e.id, e.parallel]));
    expect(byId).toEqual({ c: true, b: true, a: false });
  });
});

describe('dados da Experiência', () => {
  it.each(['pt', 'en'])('%s: cada cargo tem datas, conquistas e tags; a formação está na lista', (lang) => {
    const { experience, education } = resumeData[lang];
    expect(experience).toHaveLength(3);
    experience.forEach((e) => {
      expect(e.start).toMatch(/^\d{4}-\d{2}$/);
      expect(e.highlights.length).toBeGreaterThanOrEqual(2);
      expect(e.tags.length).toBeGreaterThanOrEqual(3);
    });
    expect(education.institution).toBe('FACENS');
  });
});
