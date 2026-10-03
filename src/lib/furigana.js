// ふりがな: a leitura em hiragana pequena em cima dos kanji do site, para quem não lê japonês
export const READINGS = {
  // Seções da home (trilho e títulos)
  山: 'やま',
  人: 'ひと',
  技: 'わざ',
  作: 'さく',
  歩: 'あゆみ',
  縁: 'えん',
  // Áreas do jardim do Stack
  言: 'こと',
  表: 'おもて',
  裏: 'うら',
  蔵: 'くら',
  守: 'まもり',
  流: 'ながれ',
  // Sobrenomes
  奥山: 'おくやま',
  芳賀: 'はが',
};

export function readingOf(text) {
  return READINGS[text] ?? null;
}
