import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { buildProjectList, typeCounts, TYPE_ORDER } from '../../src/lib/projects';
import { resumeData } from '../../src/data/resume';
import { KANJI_NUMBERS } from '../../src/lib/kanji';

describe('buildProjectList', () => {
  const projects = [
    { slug: 'a', type: 'fullstack', featured: true },
    { slug: 'b', type: 'front', group: 'g' },
    { slug: 'c', type: 'front' },
    { slug: 'd', type: 'back', group: 'g' },
  ];

  it('separa o destaque e junta o grupo no lugar do primeiro membro', () => {
    const list = buildProjectList(projects);
    expect(list.featured.project.slug).toBe('a');
    expect(list.cards.map((c) => c.key)).toEqual(['g', 'c']);
    const group = list.cards[0];
    expect(group.parts.map((p) => [p.project.slug, p.index])).toEqual([['b', 1], ['d', 3]]);
    expect(group.types).toEqual(['front', 'back']);
  });

  it('conta cartões por tipo (o grupo entra em todos os tipos das partes)', () => {
    expect(typeCounts(buildProjectList(projects))).toEqual({ fullstack: 1, front: 2, back: 1, desktop: 0 });
  });
});

describe('dados dos projetos', () => {
  it.each(['pt', 'en'])('%s: tipo válido, destaque único, grupos com título e kanji para todos', (lang) => {
    const { projects, projectsPage } = resumeData[lang];
    expect(projects.length).toBeLessThanOrEqual(KANJI_NUMBERS.length);
    projects.forEach((p) => expect(TYPE_ORDER).toContain(p.type));
    expect(projects.filter((p) => p.featured).map((p) => p.slug)).toEqual(['imacardios']);
    const list = buildProjectList(projects);
    list.cards.filter((c) => c.kind === 'group').forEach((g) => {
      expect(projectsPage.groups[g.key].title).toBeTruthy();
      expect(g.parts).toHaveLength(2);
    });
  });

  it('os mesmos projetos, na mesma ordem, nos dois idiomas', () => {
    expect(resumeData.en.projects.map((p) => p.slug)).toEqual(resumeData.pt.projects.map((p) => p.slug));
  });

  it.each(['pt', 'en'])('%s: cada projeto tem papel, contexto e período; os estudos de caso estão completos', (lang) => {
    resumeData[lang].projects.forEach((p) => {
      expect(p.role, p.slug).toBeTruthy();
      expect(p.context, p.slug).toBeTruthy();
      expect(p.period.start, p.slug).toMatch(/^20\d\d-\d\d$/);
      if (p.period.end) expect(p.period.end >= p.period.start, p.slug).toBe(true);
      if (p.caseStudy) {
        expect(p.caseStudy.challenge.length, p.slug).toBeGreaterThan(40);
        expect(p.caseStudy.decisions.length, p.slug).toBeGreaterThanOrEqual(3);
        expect(p.caseStudy.result.length, p.slug).toBeGreaterThan(40);
      }
    });
    const cases = resumeData[lang].projects.filter((p) => p.caseStudy).map((p) => p.slug);
    expect(cases).toEqual(expect.arrayContaining(['imacardios', 'saeko-artes', 'arca-construtora', 'glow-laser', 'fit-ai-frontend']));
  });

  it('as APIs sem tela mostram as rotas, e toda imagem de projeto existe em public/', () => {
    const publicDir = path.resolve(__dirname, '../../public');
    resumeData.pt.projects.forEach((p) => {
      (p.images ?? []).forEach((img) => expect(fs.existsSync(path.join(publicDir, img.src)), img.src).toBe(true));
      (p.endpoints ?? []).forEach((e) => {
        expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).toContain(e.method);
        expect(e.path.startsWith('/')).toBe(true);
      });
    });
    const apis = resumeData.pt.projects.filter((p) => p.endpoints?.length).map((p) => p.slug);
    expect(apis).toEqual(['devflix-backend', 'api-leadmagnet', 'api-library']);
  });
});
