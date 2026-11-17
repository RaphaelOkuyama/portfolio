// Sons da evolução, sintetizados em onda quadrada como no Famicom (sem arquivo de áudio): os
// bipes que sobem enquanto a silhueta pisca e uma fanfarra curta, original, na hora da forma nova.
// Seguem a preferência de música do Famicom e só tocam depois de um gesto (regra dos navegadores)
let context = null;

const muted = () => {
  try { return localStorage.getItem('retro-music') === 'off'; } catch { return false; }
};

export function unlockEvolutionSound() {
  try {
    if (muted()) return;
    const Audio = window.AudioContext ?? window.webkitAudioContext;
    if (!Audio) return;
    if (!context || context.state === 'closed') context = new Audio();
    if (context.state === 'suspended') context.resume().catch(() => {});
  } catch { /* Som indisponível: a evolução visual continua. */ }
}

const ready = () => context && context.state === 'running' && !muted();

// Uma nota: MIDI, quando (s a partir de agora), duração, volume e forma da onda
function note(midi, at, dur, gain = 0.035, type = 'square') {
  const t = context.currentTime + at;
  const osc = context.createOscillator();
  const g = context.createGain();
  osc.type = type;
  osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  g.gain.setValueAtTime(gain, t);
  g.gain.setValueAtTime(gain, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(context.destination);
  osc.onended = () => { osc.disconnect(); g.disconnect(); };
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Bipe de cada troca da silhueta: sobe meio tom por vez
export function playEvolutionTick(step) {
  try {
    if (!ready()) return;
    note(64 + step, 0, 0.06, 0.022);
  } catch { /* Navegadores podem bloquear áudio até o próximo gesto. */ }
}

// Fanfarra da forma nova: arpejo subindo, a nota longa e o baixo em onda triangular
export function playEvolutionFanfare() {
  try {
    if (!ready()) return;
    [[72, 0, 0.11], [76, 0.11, 0.11], [79, 0.22, 0.11], [84, 0.33, 0.3], [81, 0.66, 0.12], [83, 0.78, 0.12], [84, 0.9, 0.7]]
      .forEach(([m, at, d]) => note(m, at, d, 0.04));
    [[48, 0, 0.33], [55, 0.33, 0.33], [48, 0.9, 0.7]].forEach(([m, at, d]) => note(m, at, d, 0.08, 'triangle'));
  } catch { /* Navegadores podem bloquear áudio até o próximo gesto. */ }
}

// Shiny: o brilhinho, notas agudas descendo e subindo de novo, bem rápidas
export function playShinySound() {
  try {
    if (!ready()) return;
    [[96, 0], [91, 0.06], [100, 0.12], [96, 0.2], [103, 0.26]].forEach(([m, at]) => note(m, at, 0.09, 0.025));
  } catch { /* Navegadores podem bloquear áudio até o próximo gesto. */ }
}

// Compatibilidade: o arpejo curto de antes
export function playEvolutionSound() {
  playEvolutionFanfare();
}
