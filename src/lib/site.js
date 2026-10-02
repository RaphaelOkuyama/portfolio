import { profile } from '../data/resume';

// Endereço público e perfis: metadata, sitemap, imagens de compartilhamento e dados estruturados
export const SITE_URL = 'https://portfolio-raphael-okuyama.vercel.app';

export const SOCIAL = {
  github: 'https://github.com/RaphaelOkuyama',
  linkedin: 'https://www.linkedin.com/in/raphael-okuyama/',
  email: 'raphaelokuyama123@gmail.com',
};

// schema.org/Person: o Google liga o nome (e as grafias japonesas) aos perfis e à formação
export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: profile.name,
    alternateName: ['Raphael Okuyama', profile.nameKanji, profile.nameKatakana, '奥山'],
    url: SITE_URL,
    image: `${SITE_URL}/profile.jpg`,
    email: `mailto:${SOCIAL.email}`,
    jobTitle: 'Desenvolvedor Full-Stack',
    knowsAbout: ['React', 'Next.js', 'NestJS', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma'],
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'Centro Universitário Facens (FACENS)',
    },
    address: { '@type': 'PostalAddress', addressLocality: 'São Paulo', addressCountry: 'BR' },
    sameAs: [SOCIAL.github, SOCIAL.linkedin],
  };
}

// JSON dentro de <script>: escapa "<" para um texto do currículo nunca fechar a tag
export function jsonLdScript(data) {
  return JSON.stringify(data).replace(/</g, '\u003c');
}
