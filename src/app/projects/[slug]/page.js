import { notFound } from 'next/navigation';
import { resumeData } from '../../../data/resume';
import { SITE_URL } from '../../../lib/site';
import ProjectCase from '../../../components/projects/ProjectCase';

const projects = resumeData.pt.projects;

// Todas as páginas de projeto saem prontas do build; slug fora da lista vira 404
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  const url = `${SITE_URL}/projects/${slug}`;
  return {
    title: project.title,
    description: project.shortDesc,
    alternates: { canonical: url },
    // A imagem vem de opengraph-image.js (numeral em kanji + título)
    openGraph: {
      type: 'article', url, title: project.title, description: project.shortDesc,
      siteName: 'Raphael Okuyama', locale: 'pt_BR',
    },
    twitter: { card: 'summary_large_image', title: project.title, description: project.shortDesc },
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  if (!projects.some((p) => p.slug === slug)) notFound();
  return <ProjectCase slug={slug} />;
}
