// Som ambiente da montanha, sintetizado na hora (Web Audio, nenhum arquivo para baixar): vento,
// o rio quando ele aparece, o fūrin (sino de vento) de vez em quando e o "toc" do shishi-odoshi
// quando ele bate na pedra. Desligado por padrão; quem liga tem a escolha salva (SOUND_KEY), e o som
// volta no primeiro gesto da próxima visita (o navegador só libera áudio depois de uma interação)
import { journeyStore } from '../../store/journey';
import { wind } from '../journey/wind';

export const SOUND_KEY = 'oku-sound';
const VOLUME = 0.7;

export function savedSoundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveSound(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    // Storage bloqueado: vale só nesta visita
  }
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Notas do fūrin: pentatônica aguda (o sino é pequeno), com parciais inarmônicos de sino
const FURIN_NOTES = [1568, 1760, 2093, 2349, 2637];
const BELL_PARTIALS = [[1, 1, 3.2], [2.76, 0.35, 1.6], [5.4, 0.16, 0.7]];

function createAmbience() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  let ctx;
  try {
    ctx = new AudioCtx();
  } catch {
    return null;
  }
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  // Ruído rosado aproximado (dois segundos em laço): base do vento e da água
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
  }
  const loop = () => {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = Math.random();
    src.start();
    return src;
  };

  // Vento: banda média que respira devagar e abre com a rajada da rolagem (風神)
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.7;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.0001;
  loop().connect(windFilter).connect(windGain).connect(master);

  // Rio: ruído grave e cheio, mais alto quanto mais perto da água (fim dos Projetos em diante)
  const waterLow = ctx.createBiquadFilter();
  waterLow.type = 'lowpass';
  waterLow.frequency.value = 900;
  const waterHigh = ctx.createBiquadFilter();
  waterHigh.type = 'highpass';
  waterHigh.frequency.value = 140;
  const waterGain = ctx.createGain();
  waterGain.gain.value = 0.0001;
  loop().connect(waterHigh).connect(waterLow).connect(waterGain).connect(master);

  const tone = (at, freq, peak, decay, type = 'sine') => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + decay + 0.05);
  };

  // 風鈴: o badalo bate no sino uma ou duas vezes
  const furin = () => {
    const at = ctx.currentTime + 0.02;
    const note = FURIN_NOTES[Math.floor(Math.random() * FURIN_NOTES.length)];
    const strikes = Math.random() < 0.4 ? 2 : 1;
    for (let s = 0; s < strikes; s += 1) {
      const t = at + s * (0.16 + Math.random() * 0.12);
      const level = s === 0 ? 0.032 : 0.018;
      BELL_PARTIALS.forEach(([ratio, amp, decay]) => tone(t, note * ratio * (1 + (Math.random() - 0.5) * 0.004), level * amp, decay));
    }
  };

  // 鹿威し: o bambu volta e bate na pedra (madeira oca, curta)
  const shishi = (level) => {
    const at = ctx.currentTime + 0.01;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(520, at);
    osc.frequency.exponentialRampToValueAtTime(260, at + 0.08);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.22 * level, at + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + 0.2);
    tone(at, 1240, 0.05 * level, 0.06, 'triangle');
  };

  let raf = 0;
  let stopTimer = 0;
  let nextFurin = ctx.currentTime + 4 + Math.random() * 6;
  let drift = 0;
  const tick = () => {
    const { progress, seasonMix } = journeyStore.getState();
    const now = ctx.currentTime;
    // Vento: base que oscila devagar + a rajada; no inverno mais agudo e frio
    drift += (Math.random() - 0.5) * 0.02;
    drift = Math.max(-1, Math.min(1, drift));
    const gust = wind.gust ?? 0;
    const winter = smooth(2.3, 2.9, seasonMix);
    windGain.gain.setTargetAtTime(0.05 + 0.025 * (drift * 0.5 + 0.5) + gust * 0.09, now, 0.4);
    windFilter.frequency.setTargetAtTime(360 + drift * 80 + gust * 900 + winter * 300, now, 0.5);
    // Rio: aparece no fim dos Projetos e fica cheio no Contato
    waterGain.gain.setTargetAtTime(0.0001 + smooth(0.5, 0.85, progress) * 0.09, now, 0.6);
    waterLow.frequency.setTargetAtTime(760 + Math.sin(now * 0.7) * 120, now, 0.3);
    if (now >= nextFurin) {
      // O fūrin some no inverno (é pendurado no verão)
      if (Math.random() > winter * 0.8) furin();
      nextFurin = now + 9 + Math.random() * 15;
    }
    raf = requestAnimationFrame(tick);
  };

  // O shishi-odoshi fica no jardim: o toc soa forte por perto e some longe dele
  const onShishi = () => {
    const { progress } = journeyStore.getState();
    const near = smooth(0.02, 0.12, progress) * (1 - smooth(0.32, 0.45, progress));
    if (near > 0.05) shishi(near);
  };

  const onVisibility = () => {
    if (document.hidden) ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  };

  return {
    start() {
      clearTimeout(stopTimer);
      ctx.resume().catch(() => {});
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(VOLUME, ctx.currentTime, 0.6);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
      window.addEventListener('oku:shishi', onShishi);
      document.addEventListener('visibilitychange', onVisibility);
    },
    stop() {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.35);
      window.removeEventListener('oku:shishi', onShishi);
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        cancelAnimationFrame(raf);
        ctx.suspend().catch(() => {});
      }, 1600);
    },
  };
}

let ambience = null;

// Liga ou desliga (cria o contexto de áudio só na primeira vez, sempre dentro de um gesto)
export function setAmbience(on) {
  if (on) {
    ambience ??= createAmbience();
    ambience?.start();
  } else {
    ambience?.stop();
  }
  return Boolean(ambience) || !on;
}
