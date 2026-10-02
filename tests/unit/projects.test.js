import { describe, it, expect } from 'vitest';
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
});
