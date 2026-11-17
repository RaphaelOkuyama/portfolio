// 太鼓: o jogo de ritmo do festival (palavra secreta). Funções puras: as palavras, os níveis com
// as partituras, o julgamento da batida, os pontos e a nota final

export const TAIKO = {
  // Palavras secretas (digitadas fora de campos de texto)
  words: ['taiko', 'matsuri'],
  // Tempo que a nota leva para atravessar a pista até o alvo (s)
  travel: 1.7,
  // Tempos de contagem antes da primeira nota (dois compassos: a música entra, depois 三 二 一)
  leadBeats: 8,
  // Janelas de acerto (s): 良 (ryō, em cheio) e 可 (ka, quase)
  good: 0.06,
  ok: 0.13,
  // Fração da barra 魂 (alma) para passar
  clear: 0.7,
  bestKey: 'taiko-best',
};

// A partitura: 'd' é don (o centro do tambor), 'k' é ka (a borda), 'D' e 'K' são as notas
// grandes (valem o dobro), '.' é pausa. `step` é quanto de um tempo vale cada caractere
const KANTAN = [
  'd...d...', 'd...d...', 'd.d.d...', 'k...k...',
  'd...k...', 'd...k...', 'd.d.k...', 'd.d.k...',
  'd.k.d.k.', 'd...d.d.', 'k.k.d...', 'd.d.d.d.',
  'd.k.d.k.', 'd.d.k.k.', 'd.k.d.d.', 'd...D...',
];
const FUTSUU = [
  'd.d.d...', 'k.k.d...', 'd.dkd...', 'k.kdk...',
  'd.k.d.k.', 'ddk.ddk.', 'd.d.k.k.', 'd.kkd...',
  'd.ddk.d.', 'd.ddk.k.', 'kkd.kkd.', 'd.d.D...',
  'ddkkd.d.', 'ddkkd.k.', 'd.k.ddkk', 'd.d.k.k.',
  'ddk.ddk.', 'kkd.kkd.', 'ddkkddkk', 'd...D...',
];
const ONI = [
  'd...d...d.d.k...', 'd...k...d.d.k.k.', 'd.d.k.d.d.k.k...', 'd.dkd.k.d.dkd...',
  'ddk.d.k.ddk.d...', 'k.k.ddk.k.k.dd..', 'd.k.d.kkd.k.d.kk', 'ddkkd...ddkkd...',
  'd.ddk.ddk.d.k...', 'k.kkd.kkd.k.d...', 'd.k.dkd.d.k.dkd.', 'ddddk...kkkkd...',
  'd.d.kkd.d.d.kkd.', 'dkd.kdk.dkd.k...', 'ddk.ddk.ddkkddkk', 'd...D...K...D...',
];

export const TAIKO_LEVELS = [
  { id: 'kantan', jp: 'かんたん', name: { pt: 'Fácil', en: 'Easy' }, bpm: 100, step: 0.5, score: KANTAN.join('') },
  { id: 'futsuu', jp: 'ふつう', name: { pt: 'Normal', en: 'Normal' }, bpm: 116, step: 0.5, score: FUTSUU.join('') },
  { id: 'oni', jp: 'おに', name: { pt: 'Difícil', en: 'Hard' }, bpm: 124, step: 0.25, score: ONI.join('') },
];

// Notas com o instante (s) em que devem ser batidas. `lead` é a contagem antes da primeira (s)
export function taikoChart(score, bpm, lead, step = 0.5) {
  const unit = (60 / bpm) * step;
  const notes = [];
  [...score].forEach((c, i) => {
    const lower = c.toLowerCase();
    if (lower === 'd' || lower === 'k') notes.push({ type: lower === 'd' ? 'don' : 'ka', big: c !== lower, time: lead + i * unit, state: 'pending' });
  });
  return notes;
}

// A partitura de um nível, com a contagem dele
export function levelChart(level) {
  return taikoChart(level.score, level.bpm, TAIKO.leadBeats * (60 / level.bpm), level.step);
}

// Julga uma batida: a nota pendente do mesmo tipo mais próxima dentro da janela. Devolve
// { index, grade } com grade 'good' | 'ok', ou null se a batida caiu no vazio
export function judgeHit(notes, type, now, { good = TAIKO.good, ok = TAIKO.ok } = {}) {
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

// Pontos de uma batida: 良 vale 100 e 可 vale 50; a cada 10 de sequência o valor sobe 10%
// (até o dobro), e a nota grande vale o dobro
export function hitScore(grade, combo, big = false) {
  const base = grade === 'good' ? 100 : 50;
  const bonus = 1 + Math.min(10, Math.floor(combo / 10)) * 0.1;
  return Math.round(base * bonus * (big ? 2 : 1));
}

// 魂: quanto cada resultado mexe na barra (em fração dela), para uma música de `total` notas.
// Só acertos em cheio passam com folga; errar tira
export function soulStep(result, total) {
  const unit = 1 / Math.max(1, total);
  if (result === 'good') return unit * 1.3;
  if (result === 'ok') return unit * 0.65;
  return -unit * 0.8;
}

// Nota final, em kanji de boletim japonês: 秀 (excelente), 優, 良, 可. Conta a precisão: 良 vale
// uma nota inteira, 可 vale meia
export function taikoRank(goods, oks, total) {
  const ratio = total ? (goods + oks * 0.5) / total : 0;
  if (ratio >= 0.92) return '秀';
  if (ratio >= 0.75) return '優';
  if (ratio >= 0.5) return '良';
  return '可';
}

// Recordes por nível, guardados no navegador: { kantan: 12300, ... }
export function readBest(storage) {
  try {
    const raw = JSON.parse(storage.getItem(TAIKO.bestKey) ?? '{}');
    const best = {};
    TAIKO_LEVELS.forEach((l) => { if (Number.isFinite(raw?.[l.id]) && raw[l.id] > 0) best[l.id] = Math.round(raw[l.id]); });
    return best;
  } catch {
    return {};
  }
}

// Guarda o recorde se a pontuação for maior. Devolve os recordes atualizados e se bateu o anterior
export function saveBest(storage, levelId, score) {
  const best = readBest(storage);
  const record = score > (best[levelId] ?? 0);
  if (record) {
    best[levelId] = score;
    try {
      storage.setItem(TAIKO.bestKey, JSON.stringify(best));
    } catch {
      // Storage bloqueado: o recorde só não persiste
    }
  }
  return { best, record };
}
