// Ciclo do nome japonês acima do título do hero (ScrambleText): katakana → hiragana → katakana...

// Caracteres (katakana de meia largura, para o texto não estourar a largura) que "embaralham" durante a troca
export const SCRAMBLE_CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';

export const NAME_HOLD_SECONDS = 3.5;
export const NAME_SCRAMBLE_SECONDS = 1.4;

// A linha começa no katakana; a sequência é o que vem depois, terminando nele de novo.
// O nome latino fica fixo no h1: quem chega sempre lê quem é
export function buildNameSequence(profile) {
  return [profile.nameHiragana, profile.nameKatakana];
}
