// Numerais em kanji para os painéis e páginas de projeto (一, 二, ... 十二)
export const KANJI_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

export function kanjiNumber(index) {
  return KANJI_NUMBERS[index] ?? String(index + 1);
}
