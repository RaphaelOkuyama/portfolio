// 八咫烏 (Yatagarasu): o corvo de três pernas, mensageiro que guia quem está perdido. Pousa no
// torii da hero quando a pessoa fica um tempo parada e, clicado, dá uma dica de um easter egg.
// Ponte entre a cena (o corvo 3D) e a página (o clique e o balão), como o toriiHit

// Parado por este tempo (sem rolar, teclar ou clicar) na hero, o corvo vem
export const CROW = { idleMs: 18000, heroProgress: 0.05 };

export const CROW_CAW = 'okuyama:crow-caw';

// Dicas, uma por clique, em ordem (voltam ao começo)
export const CROW_HINTS = {
  pt: [
    'O torii guarda a sua sorte. Clique nele.',
    'À noite, olhe bem para a lua... e toque nela.',
    'As carpas do rio estão com fome. Nove porções mudam o destino de uma delas.',
    'Cinco kodama se escondem na floresta. Ache todos.',
    'A katana do caminho aceita golpes. O terceiro é certeiro, e corta até pedra.',
    'Digite "domain" em qualquer lugar. Ou segure o kanji 技 por um instante.',
    'Carimbe o hanko do rodapé cinco vezes seguidas. Ou tente o código mais famoso dos videogames.',
  ],
  en: [
    'The torii holds your fortune. Click it.',
    'At night, look closely at the moon... and touch it.',
    'The river koi are hungry. Nine servings change the fate of one of them.',
    'Five kodama hide in the forest. Find them all.',
    'The katana on the path takes strikes. The third one lands true, and cuts through stone.',
    'Type "domain" anywhere. Or hold the 技 kanji for a moment.',
    'Stamp the footer hanko five times in a row. Or try the most famous code in video games.',
  ],
};

export function crowHint(lang, index) {
  const list = CROW_HINTS[lang] ?? CROW_HINTS.pt;
  return list[((index % list.length) + list.length) % list.length];
}

let tester = null;

export function setCrowHitTester(fn) {
  tester = fn;
  return () => {
    if (tester === fn) tester = null;
  };
}

// O clique (em px) acertou o corvo pousado?
export function hitsCrow(clientX, clientY) {
  return tester ? tester(clientX, clientY) : false;
}
