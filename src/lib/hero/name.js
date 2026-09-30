// Ciclo do nome no hero (ScrambleText): latino → katakana → kanji → latino...

// Caracteres (katakana de meia largura, para o texto não estourar a largura) que "embaralham" durante a troca
export const SCRAMBLE_CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';

export const NAME_HOLD_SECONDS = 3.5;
export const NAME_SCRAMBLE_SECONDS = 1.4;

// O hero começa no nome latino; a sequência é o que vem depois, terminando nele de novo
export function buildNameSequence(profile) {
  return [profile.nameKatakana, profile.nameKanji, profile.name];
}
