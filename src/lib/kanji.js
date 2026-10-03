// Numerais em kanji (一, 二, ... 十一, 二十, 百): painéis e páginas de projeto, varetas do omikuji
const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

// 1 a 100; fora disso, o número comum
export function kanjiNumeral(n) {
  if (!Number.isInteger(n) || n < 1 || n > 100) return String(n);
  if (n === 100) return '百';
  const tens = Math.floor(n / 10);
  return `${tens > 1 ? DIGITS[tens] : ''}${tens > 0 ? '十' : ''}${DIGITS[n % 10]}`;
}

export const KANJI_NUMBERS = Array.from({ length: 20 }, (_, i) => kanjiNumeral(i + 1));

// Índice começando em 0 (posição na lista)
export function kanjiNumber(index) {
  return kanjiNumeral(index + 1);
}
