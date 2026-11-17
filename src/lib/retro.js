// ファミコン: o modo de 8 bits. A cena é desenhada numa tela de poucos pixels (ver Canvas3D) e
// uma música chiptune toca em onda quadrada e triangular, como num console antigo

// Largura da tela de jogo em pixels: a cena é desenhada assim e ampliada sem suavizar
export const RETRO_WIDTH = 320;
export const retroDpr = (viewportWidth) => Math.min(1, RETRO_WIDTH / Math.max(1, viewportWidth));

// Melodia própria na escala yō (ré mi sol lá si), a dos cantos de festival. Cada item: [nota MIDI
// ou 0 para pausa, duração em colcheias]
const LEAD = [
  [74, 2], [76, 1], [79, 1], [81, 2], [79, 2], [76, 1], [74, 1], [71, 2], [69, 4],
  [71, 2], [74, 1], [76, 1], [79, 2], [81, 1], [83, 1], [81, 2], [79, 2], [76, 4],
  [86, 2], [83, 1], [81, 1], [79, 2], [81, 2], [83, 1], [81, 1], [79, 2], [76, 4],
  [74, 1], [76, 1], [79, 2], [76, 1], [74, 1], [71, 2], [69, 2], [71, 2], [74, 4],
];
const BASS = [50, 50, 57, 57, 55, 55, 57, 57, 47, 47, 55, 55, 52, 52, 57, 57];
const BPM = 138;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Toca em laço até stop(). Agenda as notas um pouco à frente do relógio do áudio
export function createChiptune() {
  const Ctx = typeof window !== 'undefined' ? window.AudioContext ?? window.webkitAudioContext : null;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);
  master.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 0.4);
  const eighth = 60 / BPM / 2;
  const noise = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

  const tone = (type, freq, at, dur, gain) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, at);
    g.gain.setValueAtTime(gain, at + dur * 0.7);
    g.gain.linearRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(master);
    o.start(at);
    o.stop(at + dur + 0.02);
  };
  const hat = (at) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
    src.connect(g).connect(master);
    src.start(at);
  };

  let leadIndex = 0;
  let leadAt = ctx.currentTime + 0.1;
  let step = 0;
  let stepAt = leadAt;
  const schedule = () => {
    const horizon = ctx.currentTime + 0.5;
    while (leadAt < horizon) {
      const [midi, len] = LEAD[leadIndex % LEAD.length];
      if (midi) tone('square', hz(midi), leadAt, len * eighth * 0.92, 0.5);
      leadAt += len * eighth;
      leadIndex += 1;
    }
    while (stepAt < horizon) {
      // Baixo em onda triangular nos tempos e chimbal de ruído nos contratempos
      if (step % 2 === 0) tone('triangle', hz(BASS[(step / 2) % BASS.length] - 12), stepAt, eighth * 1.7, 0.9);
      else hat(stepAt);
      stepAt += eighth;
      step += 1;
    }
  };
  schedule();
  const timer = setInterval(schedule, 200);
  return {
    stop() {
      clearInterval(timer);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      setTimeout(() => ctx.close().catch(() => {}), 250);
    },
  };
}
