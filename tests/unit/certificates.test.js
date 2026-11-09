import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  groupByArea, summaryText, studyHours, certCount, certDate, certHours, certKey, viewerEntries, degreeDone, AREA_ORDER,
} from '../../src/lib/certificates';
import { resumeData } from '../../src/data/resume';
import { TOOL_ICONS } from '../../src/components/stack/toolIcons';

const PUBLIC = path.resolve(__dirname, '../../public');

describe('certificados', () => {
  const sample = [
    { id: 1, area: 'base', name: 'Trilha', modules: [{ label: 'I', date: '2024-11-27', hours: 8 }, { label: 'II', date: '2025-05-02', hours: 12 }] },
    { id: 2, area: 'full', name: 'Bootcamp', kind: 'bootcamp', date: '2026-03-11', hours: 10 },
    { id: 3, area: 'full', name: 'Formação', kind: 'formation', date: '2025-10-07', hours: 200 },
    { id: 4, area: 'full', name: 'Mais novo', date: '2026-03-27', hours: 18 },
  ];

  it('agrupa na ordem das áreas, a formação primeiro e o resto do mais recente para o mais antigo, contando linhas', () => {
    const groups = groupByArea(sample);
    expect(groups.map((g) => g.area)).toEqual(['full', 'base']);
    expect(groups[0].items.map((c) => c.name)).toEqual(['Formação', 'Mais novo', 'Bootcamp']);
    expect(groups.map((g) => g.count)).toEqual([3, 1]);
    expect(certCount(sample[0])).toBe(2);
  });

  it('a trilha termina no módulo mais recente e soma as horas', () => {
    expect(certDate(sample[0])).toBe('2025-05-02');
    expect(certHours(sample[0])).toBe(20);
    expect(certHours(sample[2])).toBe(200);
  });

  it('o visualizador percorre cada módulo como um certificado, na ordem da página', () => {
    const entries = viewerEntries(sample);
    expect(entries.map((e) => e.key)).toEqual(['3', '4', '2', certKey(sample[0], 0), certKey(sample[0], 1)]);
    expect(entries.at(-1)).toMatchObject({ name: 'Trilha · II', area: 'base', hours: 12 });
  });

  it('monta o resumo do topo', () => {
    expect(summaryText('{certs} · {bootcamps} · {formations}', sample)).toBe('5 · 1 · 1');
  });

  it('soma as horas sem contar duas vezes os cursos que fazem parte da formação', () => {
    const school = [
      { id: 1, institution: 'Escola', kind: 'formation', hours: 200 },
      { id: 2, institution: 'Escola', hours: 22 },
      { id: 3, institution: 'Escola', modules: [{ hours: 10 }, { hours: 5 }] },
      { id: 4, institution: 'Bootcamp', kind: 'bootcamp', hours: 18 },
    ];
    expect(studyHours(school)).toBe(218);
    expect(studyHours(resumeData.pt.certificates)).toBe(228);
    expect(summaryText('{hours}h', school)).toBe('218h');
  });

  it('a graduação fica prevista até o mês de conclusão e concluída depois dele', () => {
    expect(degreeDone('2026-12', new Date(2026, 10, 9))).toBe(false);
    expect(degreeDone('2026-12', new Date(2026, 11, 20))).toBe(false);
    expect(degreeDone('2026-12', new Date(2027, 0, 3))).toBe(true);
  });

  it.each(['pt', 'en'])('%s: os 22 certificados têm data, carga horária e imagem própria (sem link para os PDFs)', (lang) => {
    const list = resumeData[lang].certificates;
    const items = list.flatMap((c) => (c.modules ? c.modules : [c]));
    expect(items).toHaveLength(22);
    const images = items.map((c) => c.image.src);
    expect(new Set(images).size).toBe(22);
    items.forEach((c) => {
      expect(c.date).toMatch(/^20\d\d-\d\d-\d\d$/);
      expect(c.hours).toBeGreaterThan(0);
      expect(c.image.width).toBeGreaterThan(c.image.height);
      expect(fs.existsSync(path.join(PUBLIC, c.image.src))).toBe(true);
      // Os PDFs do Drive trazem o CPF na segunda folha: o site não aponta mais para eles
      expect(JSON.stringify(c)).not.toMatch(/drive\.google|\.pdf/);
    });
    list.forEach((c) => {
      expect(AREA_ORDER).toContain(c.area);
      expect(c.icon === 'award' || TOOL_ICONS[c.icon]).toBeTruthy();
    });
    expect(summaryText(resumeData[lang].certificatesPage.summary, list)).toMatch(/^228h .* 22 /);
  });

  it('pt e en apontam para as mesmas imagens, datas e horas', () => {
    const flat = (lang) => resumeData[lang].certificates.flatMap((c) => (c.modules ? c.modules : [c]))
      .map((c) => `${c.image.src}|${c.date}|${c.hours}`).sort();
    expect(flat('en')).toEqual(flat('pt'));
  });
});
