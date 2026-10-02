import { resumeData } from '../../../data/resume';
import { kanjiNumber } from '../../../lib/kanji';
import { ogCard, OG_SIZE } from '../../../lib/ogCard';

const projects = resumeData.pt.projects;

export const alt = 'Projeto de Raphael Okuyama';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

const pad = (n) => String(n).padStart(2, '0');

// Card de compartilhamento do projeto: o numeral em kanji dele, o título e a descrição curta
export default async function Image({ params }) {
  const { slug } = await params;
  const index = Math.max(0, projects.findIndex((p) => p.slug === slug));
  const project = projects[index];
  return ogCard({
    eyebrow: `PROJETO ${pad(index + 1)} / ${pad(projects.length)}`,
    title: project.title,
    subtitle: project.shortDesc,
    kanji: kanjiNumber(index),
  });
}
