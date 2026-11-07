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

// 大字 daiji: os numerais formais dos documentos e das cédulas (壱 弐 参…). Nos projetos eles
// substituem os comuns: o 一 vazado parecia um retângulo vazio, e os daiji têm desenho de selo
const DAIJI = ['', '壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖'];

// 1 a 99 em daiji (拾 = 10, 拾壱 = 11, 弐拾 = 20); fora disso, o número comum
export function daijiNumeral(n) {
  if (!Number.isInteger(n) || n < 1 || n > 99) return String(n);
  const tens = Math.floor(n / 10);
  return `${tens > 1 ? DAIJI[tens] : ''}${tens > 0 ? '拾' : ''}${DAIJI[n % 10]}`;
}

// Índice começando em 0 (posição na lista de projetos)
export function kanjiNumber(index) {
  return daijiNumeral(index + 1);
}
