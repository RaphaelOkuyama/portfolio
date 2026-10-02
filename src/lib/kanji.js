// Numerais em kanji para os painéis e páginas de projeto (一, 二, ... 二十)
export const KANJI_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];

export function kanjiNumber(index) {
  return KANJI_NUMBERS[index] ?? String(index + 1);
}
