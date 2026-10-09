// Som do Vazio Infinito, sintetizado na hora (Web Audio, sem arquivo para baixar). Só começa depois
// da interação que abriu o domínio (tecla ou toque: o navegador libera o áudio) e tem volume próprio,
// guardado entre visitas. Sons: o impacto grave da abertura, o vento que sobe na saturação, o estalo
// cristalino da reconstrução e o "toc" do hanko
const KEY = 'oku-domain-volume';
const DEFAULT_VOLUME = 0.55;

export function savedVolume() {
  try {
    const v = parseFloat(localStorage.getItem(KEY));
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function createDomainSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  let ctx;
  try {
    ctx = new AudioCtx();
  } catch {
    return null;
  }
  ctx.resume?.().catch(() => {});
  const master = ctx.createGain();
  master.gain.value = savedVolume() * 0.8;
  master.connect(ctx.destination);

  // Ruído branco (um segundo, reaproveitado por todos os sons)
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const noise = (at, duration, filterType, freq, q = 1) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, at);
    filter.Q.value = q;
    const gain = ctx.createGain();
    src.connect(filter).connect(gain).connect(master);
    src.start(at);
    src.stop(at + duration + 0.05);
    return { filter, gain };
  };
  const tone = (at, type, f0, f1, duration, peak, attack = 0.008) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, at);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, at + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + duration + 0.05);
  };

  return {
    // 領域展開: o golpe grave quando o vazio se abre (queda de 90 a 30 Hz, com o corpo do ruído)
    impact() {
      const at = ctx.currentTime + 0.01;
      tone(at, 'sine', 92, 30, 1.8, 0.9);
      tone(at, 'triangle', 184, 46, 0.7, 0.25);
      const { gain } = noise(at, 0.9, 'lowpass', 420, 0.7);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.45, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
    },
    // Saturação: o vento sobe de grave para agudo até o estouro
    rise(duration) {
      const at = ctx.currentTime + 0.01;
      const { filter, gain } = noise(at, duration + 0.1, 'bandpass', 260, 1.4);
      filter.frequency.exponentialRampToValueAtTime(5200, at + duration);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.32, at + duration * 0.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration + 0.1);
    },
    // Reconstrução: vidro estalando (parciais agudos que soam e somem, em cascata) e o chiado do caco
    shatter() {
      const at = ctx.currentTime + 0.01;
      const { gain } = noise(at, 0.25, 'highpass', 3200, 0.8);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
      [1760, 2637, 3520, 4186, 5274, 6272, 7040].forEach((f, i) => {
        const t = at + i * 0.045 + Math.random() * 0.03;
        tone(t, 'sine', f * (1 + (Math.random() - 0.5) * 0.02), f, 0.5 + Math.random() * 0.9, 0.09 - i * 0.007, 0.004);
      });
    },
    // 判子: o carimbo batendo no papel
    stamp() {
      const at = ctx.currentTime + 0.01;
      tone(at, 'sine', 170, 80, 0.16, 0.5, 0.003);
      const { gain } = noise(at, 0.08, 'lowpass', 900, 0.7);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
    },
    setVolume(v) {
      const vol = Math.min(1, Math.max(0, v));
      master.gain.setTargetAtTime(vol * 0.8, ctx.currentTime, 0.03);
      try {
        localStorage.setItem(KEY, String(vol));
      } catch {
        // Storage bloqueado: o volume só não persiste
      }
    },
    dispose() {
      // Deixa o fim do último som soar antes de fechar
      setTimeout(() => ctx.close().catch(() => {}), 1800);
    },
  };
}
