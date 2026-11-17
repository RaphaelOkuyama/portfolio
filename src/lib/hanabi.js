// 花火: o segredo do festival. Um minijogo de taiko em que cada batida certa solta um fogo de
// artifício sobre a página. Funções puras: as palavras, a partitura e o julgamento da batida

export const HANABI = {
  // Palavras secretas (digitadas fora de campos de texto)
  words: ['hanabi', 'matsuri', 'taiko'],
  bpm: 112,
  // Tempo que a nota leva para atravessar a pista até o alvo (s) e a contagem antes da primeira
  travel: 1.6,
  lead: 2.2,
  // Janelas de acerto (s): 良 (ryō, em cheio) e 可 (ka, passou)
  good: 0.07,
  ok: 0.15,
};

// A partitura: 'd' é don (o centro do tambor), 'k' é ka (a borda), '.' é pausa. Cada caractere
// vale meio tempo. Começa simples e aperta no fim, como batida de festival
const SCORE = 'd...d...d.d.d...k...k...d.d.k...d.k.d.k.d.d.k.k.d...d.d.d.k.d.k.ddkkd.d.d...';

// Notas com o instante (s) em que devem ser batidas
export function hanabiChart(score = SCORE, bpm = HANABI.bpm, lead = HANABI.lead) {
  const half = 60 / bpm / 2;
  const notes = [];
  [...score].forEach((c, i) => {
    if (c === 'd' || c === 'k') notes.push({ type: c === 'd' ? 'don' : 'ka', time: lead + i * half, state: 'pending' });
  });
  return notes;
}

// Julga uma batida: a nota pendente do mesmo tipo mais próxima dentro da janela. Devolve
// { index, grade } com grade 'good' | 'ok', ou null se a batida caiu no vazio
export function judgeHit(notes, type, now, { good = HANABI.good, ok = HANABI.ok } = {}) {
  let best = -1;
  let bestGap = Infinity;
  notes.forEach((n, i) => {
    if (n.state !== 'pending' || n.type !== type) return;
    const gap = Math.abs(n.time - now);
    if (gap < bestGap) { best = i; bestGap = gap; }
  });
  if (best < 0 || bestGap > ok) return null;
  return { index: best, grade: bestGap <= good ? 'good' : 'ok' };
}

// Nota final, em kanji de boletim japonês: 秀 (excelente), 優, 良, 可
export function hanabiRank(hits, total) {
  const ratio = total ? hits / total : 0;
  if (ratio >= 0.95) return '秀';
  if (ratio >= 0.8) return '優';
  if (ratio >= 0.55) return '良';
  return '可';
}
