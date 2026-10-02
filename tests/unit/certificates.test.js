import { describe, it, expect } from 'vitest';
import { groupByArea, summaryText, certCount, AREA_ORDER } from '../../src/lib/certificates';
import { resumeData } from '../../src/data/resume';
import { TOOL_ICONS } from '../../src/components/stack/toolIcons';

describe('certificados', () => {
  const sample = [
    { id: 1, area: 'base', name: 'Trilha', modules: [{ label: 'I' }, { label: 'II' }] },
    { id: 2, area: 'full', name: 'Bootcamp', kind: 'bootcamp' },
    { id: 3, area: 'full', name: 'Formação', kind: 'formation' },
  ];

  it('agrupa na ordem das áreas e conta cada módulo da trilha', () => {
    const groups = groupByArea(sample);
    expect(groups.map((g) => g.area)).toEqual(['full', 'base']);
    expect(groups.map((g) => g.count)).toEqual([2, 2]);
    expect(certCount(sample[0])).toBe(2);
  });

  it('monta o resumo do topo', () => {
    expect(summaryText('{certs} · {bootcamps} · {formations}', sample)).toBe('4 · 1 · 1');
  });

  it.each(['pt', 'en'])('%s: os 22 certificados continuam lá, com links únicos e logo conhecido', (lang) => {
    const list = resumeData[lang].certificates;
    const links = list.flatMap((c) => (c.modules ? c.modules.map((m) => m.link) : [c.link]));
    expect(links).toHaveLength(22);
    expect(new Set(links).size).toBe(22);
    list.forEach((c) => {
      expect(AREA_ORDER).toContain(c.area);
      expect(c.icon === 'award' || TOOL_ICONS[c.icon]).toBeTruthy();
    });
    expect(summaryText(resumeData[lang].certificatesPage.summary, list)).toMatch(/^22 /);
  });
});
