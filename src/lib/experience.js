// Linha do tempo da Experiência: períodos, duração e cargos em paralelo.
// Datas em 'AAAA-MM'; end = null é o cargo atual.

const MONTHS = {
  pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function parse(ym) {
  const [y, m] = ym.split('-').map(Number);
  return { y, m };
}

// Mês atual em 'AAAA-MM'
export function currentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Meses de experiência contando o mês de início e o de fim (como o LinkedIn)
export function monthsBetween(start, end) {
  const a = parse(start);
  const b = parse(end);
  return Math.max(1, (b.y - a.y) * 12 + (b.m - a.m) + 1);
}

export function formatMonth(ym, lang) {
  const { y, m } = parse(ym);
  return `${MONTHS[lang][m - 1]} ${y}`;
}

export function formatPeriod(start, end, lang, currentLabel) {
  return `${formatMonth(start, lang)} - ${end ? formatMonth(end, lang) : currentLabel}`;
}

export function formatDuration(months, lang) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (lang === 'en') {
    const parts = [];
    if (years) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
    if (rest) parts.push(`${rest} ${rest === 1 ? 'mo' : 'mos'}`);
    return parts.join(' ');
  }
  const y = years ? `${years} ${years === 1 ? 'ano' : 'anos'}` : '';
  const m = rest ? `${rest} ${rest === 1 ? 'mês' : 'meses'}` : '';
  return [y, m].filter(Boolean).join(' e ');
}

// Do mais recente para o mais antigo; marca quem se sobrepõe a outro cargo (em paralelo)
export function orderTimeline(entries, today = currentMonth()) {
  const sorted = [...entries].sort((a, b) => b.start.localeCompare(a.start));
  const span = (e) => [e.start, e.end ?? today];
  return sorted.map((entry) => {
    const [s, e] = span(entry);
    const parallel = sorted.some((other) => {
      if (other === entry) return false;
      const [os, oe] = span(other);
      return s <= oe && os <= e && !(e === os || oe === s);
    });
    return { ...entry, parallel };
  });
}
