import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Github } from 'lucide-react';
import { resumeData } from '../../data/resume';
import { buildProjectList, typeCounts, TYPE_ORDER } from '../../lib/projects';
import { kanjiNumber } from '../../lib/kanji';
import { SOCIAL } from '../../lib/site';
import KeepHyphenated from '../../components/KeepHyphenated';
import Lang from '../../components/Lang';
import ProjectBoard from '../../components/projects/ProjectBoard';

export const metadata = {
  title: 'Projetos',
  description: 'Projetos de Raphael Okuyama: da plataforma de telecardiologia em produção a landing pages, APIs e apps.',
};

const pad = (n) => String(n + 1).padStart(2, '0');

// Links externos do projeto: ficam acima do link que cobre o cartão inteiro
function ExternalLinks({ project, labels, compact = false }) {
  if (!project.deployLink && !project.repoLink) return null;
  return (
    <span className="pj-external">
      {project.deployLink && (
        <a href={project.deployLink} target="_blank" rel="noopener noreferrer" aria-label={`${labels.btnDeploy}: ${project.title}`}>
          {!compact && labels.btnDeploy} <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      )}
      {project.repoLink && (
        <a href={project.repoLink} target="_blank" rel="noopener noreferrer" aria-label={`${labels.btnCode}: ${project.title}`}>
          <Github size={15} aria-hidden="true" /> {!compact && 'GitHub'}
        </a>
      )}
    </span>
  );
}

function Status({ project, labels }) {
  const live = Boolean(project.deployLink);
  return <span className={live ? 'pj-status is-live' : 'pj-status'}>{live ? labels.statusLive : labels.statusCode}</span>;
}

function Tags({ stack }) {
  return (
    <ul className="pj-tags">
      {stack.slice(0, 4).map((tech) => <li key={tech}>{tech}</li>)}
    </ul>
  );
}

function SingleCard({ project, index, labels, featured = false }) {
  return (
    <article className={featured ? 'pj-card is-featured' : 'pj-card'} data-types={project.type}>
      <span className="pj-kanji font-jp" aria-hidden="true">{kanjiNumber(index)}</span>
      <p className="pj-top">
        <span className="pj-num">{pad(index)}</span>
        {featured ? <span className="pj-status is-live">{labels.featuredLabel}</span> : <Status project={project} labels={labels} />}
      </p>
      <h2 className="pj-title">
        {/* O ::after deste link cobre o cartão: clicar em qualquer parte abre o projeto */}
        <Link href={`/projects/${project.slug}`} className="pj-stretch">
          <KeepHyphenated>{project.title}</KeepHyphenated>
        </Link>
      </h2>
      <p className="pj-desc">{project.shortDesc}</p>
      {featured && (
        <dl className="pj-stats">
          {labels.featuredStats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <Tags stack={project.stack} />
      <p className="pj-actions">
        <span className="pj-more" aria-hidden="true">{labels.btnDetails} <ArrowRight size={16} /></span>
        <ExternalLinks project={project} labels={labels} />
      </p>
    </article>
  );
}

// Produto em duas partes (ex.: app + API): um cartão, cada parte com a própria página
function GroupCard({ card, labels }) {
  const group = labels.groups[card.key];
  const first = card.parts[0];
  const stack = [...new Set(card.parts.flatMap((p) => p.project.stack))];
  return (
    <article className="pj-card is-group" data-types={card.types.join(' ')}>
      <span className="pj-kanji font-jp" aria-hidden="true">{kanjiNumber(first.index)}</span>
      <p className="pj-top">
        <span className="pj-num">{card.parts.map((p) => pad(p.index)).join(' · ')}</span>
        <span className="pj-status is-pair">{card.parts.map((p) => p.project.part).join(' + ')}</span>
      </p>
      <h2 className="pj-title"><KeepHyphenated>{group.title}</KeepHyphenated></h2>
      <p className="pj-desc">{group.desc}</p>
      <ul className="pj-parts" aria-label={labels.partsLabel}>
        {card.parts.map(({ project }) => (
          <li key={project.slug}>
            <Link href={`/projects/${project.slug}`} className="pj-part-link">
              <strong>{project.part}</strong>
              <span>{project.shortDesc}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <ExternalLinks project={project} labels={labels} compact />
          </li>
        ))}
      </ul>
      <Tags stack={stack} />
    </article>
  );
}

function ProjectGrid({ lang }) {
  const { projects, projectsPage: labels } = resumeData[lang];
  const list = buildProjectList(projects);
  return (
    <div data-lang={lang} className="pj-grid">
      {list.featured && <SingleCard {...list.featured} labels={labels} featured />}
      {list.cards.map((card) => (card.kind === 'group'
        ? <GroupCard key={card.key} card={card} labels={labels} />
        : <SingleCard key={card.key} project={card.project} index={card.index} labels={labels} />))}
    </div>
  );
}

// 作 Projetos: Server Component nos dois idiomas; só o filtro por tipo roda no navegador
export default function ProjectsPage() {
  const { pt, en } = resumeData;
  const counts = typeCounts(buildProjectList(pt.projects));
  const filters = TYPE_ORDER.filter((t) => counts[t] > 0).map((type) => ({
    type,
    count: counts[type],
    pt: pt.projectsPage.types[type],
    en: en.projectsPage.types[type],
  }));
  const total = buildProjectList(pt.projects).cards.length + 1;

  return (
    <div className="container pj-page">
      <h1 className="responsive-title section-title">
        <span className="section-kanji font-jp" aria-hidden="true">作</span>
        <Lang pt={pt.projectsPage.title} en={en.projectsPage.title} />
      </h1>
      <p className="pj-subtitle">
        <Lang pt={pt.projectsPage.subtitle} en={en.projectsPage.subtitle} />{' '}
        <a href={SOCIAL.github} target="_blank" rel="noopener noreferrer">
          <Lang pt={pt.projectsPage.githubLink} en={en.projectsPage.githubLink} />
        </a>.
      </p>

      <ProjectBoard
        filters={filters}
        total={total}
        all={{ pt: pt.projectsPage.filterAll, en: en.projectsPage.filterAll }}
        filterLabel={{ pt: pt.projectsPage.filterLabel, en: en.projectsPage.filterLabel }}
      >
        <ProjectGrid lang="pt" />
        <ProjectGrid lang="en" />
      </ProjectBoard>
    </div>
  );
}
