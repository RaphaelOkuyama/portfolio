import { resumeData, profile } from '../data/resume';
import { ogCard, OG_SIZE } from '../lib/ogCard';

export const alt = 'Raphael Okuyama, Desenvolvedor Full-Stack';
export const size = OG_SIZE;
export const contentType = 'image/png';

// Card de compartilhamento da home: 奥山 ao fundo, o nome, as funções e a disponibilidade
export default async function Image() {
  const { hero, contactPage } = resumeData.pt;
  return ogCard({
    eyebrow: 'PORTFÓLIO',
    title: profile.name,
    subtitle: `${hero.roles.join(' · ')}. ${hero.available} ${contactPage.availability.join(', ')}.`,
    kanji: '奥山',
  });
}
