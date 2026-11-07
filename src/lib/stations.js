// 丁石 (chōishi): nos caminhos de peregrinação do Japão, marcos de pedra contam quantos chō (~109 m)
// faltam até o santuário. Aqui cada seção da home é um marco a caminho do 奥の院 (oku-no-in, o
// santuário mais ao fundo), que é o Contato: o fim da caminhada montanha adentro (奥山)
export const STATIONS = [
  { id: 'hero', kanji: '山', pt: 'Início', en: 'Top' },
  { id: 'about', kanji: '人', pt: 'Sobre', en: 'About', marker: '四丁', left: { pt: 'Faltam quatro chō para o santuário', en: 'Four chō to the sanctuary' } },
  { id: 'stack', kanji: '技', pt: 'Stack', en: 'Stack', marker: '三丁', left: { pt: 'Faltam três chō', en: 'Three chō to go' } },
  { id: 'projects', kanji: '作', pt: 'Projetos', en: 'Projects', marker: '二丁', left: { pt: 'Faltam dois chō', en: 'Two chō to go' } },
  { id: 'experience', kanji: '歩', pt: 'Experiência', en: 'Experience', marker: '一丁', left: { pt: 'Falta um chō', en: 'One chō to go' } },
  { id: 'contato', kanji: '縁', pt: 'Contato', en: 'Contact', marker: '奥の院', left: { pt: 'Oku-no-in: o santuário no fim do caminho', en: 'Oku-no-in: the sanctuary at the end of the path' } },
];

// O marco de uma seção (null fora da caminhada)
export function stationFor(id) {
  return STATIONS.find((s) => s.id === id && s.marker) ?? null;
}
