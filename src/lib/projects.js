// Lista da página /projects: o destaque (featured) separado e os demais na ordem dos dados,
// com os projetos de um mesmo produto (campo group, ex.: app + API) juntos num cartão só.
// `index` é a posição no array: a mesma numeração (一, 二…) das páginas de projeto.

export const TYPE_ORDER = ['fullstack', 'front', 'back', 'desktop'];

// Os projetos do emakimono da home (o resto fica na página /projects): o rolo com todos
// passava de 5.600 px de rolagem no desktop
export const HOME_PROJECTS = ['imacardios', 'saeko-artes', 'fit-ai-frontend', 'totem-autoatendimento', 'arca-construtora', 'portfolio-okuyama'];

// Projetos da home com a posição na lista completa (a mesma numeração das páginas de projeto)
export function homeProjects(projects, slugs = HOME_PROJECTS) {
  return projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => slugs.includes(project.slug));
}

export function buildProjectList(projects) {
  const featured = projects.findIndex((p) => p.featured);
  const cards = [];
  const groups = new Map();
  projects.forEach((project, index) => {
    if (index === featured) return;
    const entry = { project, index };
    if (!project.group) {
      cards.push({ kind: 'single', key: project.slug, types: [project.type], ...entry });
      return;
    }
    if (!groups.has(project.group)) {
      const card = { kind: 'group', key: project.group, types: [], parts: [] };
      groups.set(project.group, card);
      cards.push(card);
    }
    const card = groups.get(project.group);
    card.parts.push(entry);
    if (!card.types.includes(project.type)) card.types.push(project.type);
  });
  return { featured: featured >= 0 ? { project: projects[featured], index: featured } : null, cards };
}

// Quantos cartões (destaque incluído) entram em cada filtro de tipo
export function typeCounts(list) {
  const all = [...(list.featured ? [{ types: [list.featured.project.type] }] : []), ...list.cards];
  return Object.fromEntries(TYPE_ORDER.map((t) => [t, all.filter((c) => c.types.includes(t)).length]));
}
