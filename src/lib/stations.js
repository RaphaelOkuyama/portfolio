// 駅名標: as seções da home como estações da linha Okuyama (奥山線), na ordem da subida. O número
// segue o padrão das linhas japonesas (sigla da linha + número da estação, como JY 05)
export const LINE = { code: 'OK', kanji: '奥山線', pt: 'Linha Okuyama', en: 'Okuyama Line' };

export const STATIONS = [
  { id: 'hero', kanji: '山', pt: 'Início', en: 'Top' },
  { id: 'about', kanji: '人', pt: 'Sobre', en: 'About' },
  { id: 'stack', kanji: '技', pt: 'Stack', en: 'Stack' },
  { id: 'projects', kanji: '作', pt: 'Projetos', en: 'Projects' },
  { id: 'experience', kanji: '歩', pt: 'Experiência', en: 'Experience' },
  { id: 'contato', kanji: '縁', pt: 'Contato', en: 'Contact' },
];

// Fim da linha: 終点 (shūten), em vez de uma próxima estação
export const TERMINUS = { kanji: '終点', pt: 'Fim da linha', en: 'End of the line' };

// Número da estação (OK 01…), a anterior e a próxima de uma seção
export function stationFor(id) {
  const index = STATIONS.findIndex((s) => s.id === id);
  if (index < 0) return null;
  return {
    number: `${LINE.code} ${String(index + 1).padStart(2, '0')}`,
    prev: STATIONS[index - 1] ?? null,
    next: STATIONS[index + 1] ?? null,
  };
}
