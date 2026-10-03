import { profile } from '../data/resume';
import { SITE_URL, SOCIAL } from './site';

// 名刺: o cartão de visita vira um vCard (3.0, o formato que iPhone e Android importam direto)

// Vírgula, ponto e vírgula e barra invertida têm significado no vCard; quebra de linha vira \n
export function escapeVCard(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
}

export function buildVCard({ title }) {
  const [given, ...rest] = profile.name.split(' ');
  const family = rest.pop();
  const middle = rest.join(' ');
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(family)};${escapeVCard(given)};${escapeVCard(middle)};;`,
    `FN:${escapeVCard(profile.name)}`,
    `NICKNAME:${escapeVCard(profile.nameKanji)}`,
    `TITLE:${escapeVCard(title)}`,
    `EMAIL;TYPE=INTERNET:${SOCIAL.email}`,
    `URL:${SITE_URL}`,
    `X-SOCIALPROFILE;TYPE=linkedin:${SOCIAL.linkedin}`,
    `X-SOCIALPROFILE;TYPE=github:${SOCIAL.github}`,
    'END:VCARD',
  ].join('\r\n');
}

export const VCARD_FILENAME = 'raphael-okuyama.vcf';
