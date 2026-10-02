import { resumeData } from '../data/resume';
import { SITE_URL } from '../lib/site';

export default function sitemap() {
  const pages = [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/projects`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/certificates`, changeFrequency: 'monthly', priority: 0.5 },
  ];
  const projects = resumeData.pt.projects.map(({ slug }) => ({
    url: `${SITE_URL}/projects/${slug}`,
    changeFrequency: 'yearly',
    priority: 0.7,
  }));
  return [...pages, ...projects];
}
