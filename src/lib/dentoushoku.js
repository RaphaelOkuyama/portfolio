import { lerpHex } from './journey/season';

// 伝統色 (dentō-shoku): as cores tradicionais japonesas, uma por estação da montanha, com os
// valores da lista clássica. Tingem os kanji das seções e o trilho; os botões mantêm a cor de
// destaque do tema (contraste do texto). Noite: tons claros sobre o fundo escuro; dia: tons fundos
export const SEASON_INKS = {
  night: [
    { kanji: '桃色', reading: 'momo-iro', pt: 'pêssego', en: 'peach', hex: '#f09199' },
    { kanji: '若竹色', reading: 'wakatake-iro', pt: 'bambu novo', en: 'young bamboo', hex: '#68be8d' },
    { kanji: '柿色', reading: 'kaki-iro', pt: 'caqui', en: 'persimmon', hex: '#ed6d3d' },
    { kanji: '白藍', reading: 'shiro-ai', pt: 'índigo claro', en: 'pale indigo', hex: '#c1e4e9' },
  ],
  day: [
    { kanji: '今様色', reading: 'imayō-iro', pt: 'rosa da moda', en: 'fashionable pink', hex: '#d0576b' },
    { kanji: '千歳緑', reading: 'chitose-midori', pt: 'verde dos mil anos', en: 'thousand-year green', hex: '#316745' },
    { kanji: '紅葉色', reading: 'momiji-iro', pt: 'bordo de outono', en: 'autumn maple', hex: '#bb5535' },
    { kanji: '藍色', reading: 'ai-iro', pt: 'índigo', en: 'indigo', hex: '#165e83' },
  ],
};

// Cor da estação em `mix` (0 = primavera … 3 = inverno), misturada entre as vizinhas, e o nome
// da estação mais próxima
export function seasonInk(theme, mix) {
  const inks = SEASON_INKS[theme] ?? SEASON_INKS.night;
  const m = Math.min(Math.max(mix, 0), inks.length - 1);
  const i = Math.min(Math.floor(m), inks.length - 2);
  return { ...inks[Math.round(m)], hex: lerpHex(inks[i].hex, inks[i + 1].hex, m - i) };
}
