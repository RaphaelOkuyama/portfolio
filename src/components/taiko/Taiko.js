'use client';
import { useEffect, useRef, useState } from 'react';
import { TAIKO, TAIKO_LEVELS, hitScore, judgeHit, levelChart, readBest, saveBest, soulStep, taikoRank } from '../../lib/taiko';

// 太鼓: o jogo de ritmo do festival (palavras secretas "taiko" e "matsuri"; carregado só então,
// ver EasterEggs). Um jogo completo por si só: a tela de entrada explica as regras e deixa
// escolher o nível; na partida as notas correm pela pista até o alvo ao som de uma música de
// festival (flauta, sino e tambor grave, tudo sintetizado); no fim, a nota, os pontos e o recorde

const NOTE = { don: '#e2472f', ka: '#3f7fc4' };
const KANA = { don: 'ドン', ka: 'カッ' };
const DON_KEYS = new Set(['f', 'j']);
const KA_KEYS = new Set(['d', 'k']);
const SPARKS = ['#ffd27a', '#ff8a3c', '#ff9fb5', '#a8e6ff', '#c9ffb0', '#e3c2ff'];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Melodia própria na escala yō (ré mi sol lá si), a dos cantos de festival: [nota MIDI, tempos]
const FLUTE = [
  [81, 1], [83, 0.5], [81, 0.5], [79, 1], [76, 1], [74, 1], [76, 0.5], [79, 0.5], [81, 2],
  [83, 1], [86, 0.5], [83, 0.5], [81, 1], [79, 1], [76, 0.5], [79, 0.5], [76, 0.5], [74, 0.5], [76, 2],
  [86, 1], [83, 0.5], [81, 0.5], [83, 1], [81, 1], [79, 0.5], [81, 0.5], [79, 0.5], [76, 0.5], [74, 2],
  [76, 1], [79, 1], [81, 0.5], [83, 0.5], [81, 1], [79, 0.5], [76, 0.5], [74, 1], [74, 2],
];

// Som: o tambor de quem joga (don grave, ka seco na borda) e a banda do festival, agendada
// inteira no relógio do áudio (é ele que marca o tempo das notas)
function createSound() {
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);
  const band = ctx.createGain();
  band.gain.value = 0.8;
  band.connect(master);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const burst = (at, dur, freq, gain, type = 'bandpass', q = 1, out = master) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    src.connect(filter).connect(g).connect(out);
    src.start(at);
    src.stop(at + dur + 0.02);
  };
  const thump = (at, from, to, dur, gain, out = master) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(from, at);
    o.frequency.exponentialRampToValueAtTime(to, at + dur * 0.6);
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + dur + 0.02);
  };
  const flute = (at, midi, dur) => {
    const o = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = hz(midi);
    lfo.frequency.value = 5.5;
    depth.gain.value = hz(midi) * 0.006;
    lfo.connect(depth).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(0.11, at + 0.04);
    g.gain.setValueAtTime(0.11, at + dur * 0.75);
    g.gain.linearRampToValueAtTime(0.0001, at + dur * 0.97);
    o.connect(g).connect(band);
    o.start(at);
    lfo.start(at);
    o.stop(at + dur);
    lfo.stop(at + dur);
    // O sopro no começo da nota
    burst(at, 0.05, hz(midi) * 2, 0.03, 'bandpass', 3, band);
  };
  return {
    now: () => ctx.currentTime,
    don: (big) => {
      thump(ctx.currentTime, big ? 130 : 150, 50, big ? 0.55 : 0.4, big ? 1 : 0.85);
      burst(ctx.currentTime, 0.05, 900, 0.35);
    },
    ka: (big) => {
      burst(ctx.currentTime, 0.07, 2600, big ? 0.8 : 0.6, 'bandpass', 4);
      burst(ctx.currentTime, 0.03, 6000, 0.25, 'highpass');
    },
    cheer: () => {
      [0, 0.09, 0.18].forEach((d, i) => thump(ctx.currentTime + d, 520 + i * 130, 520 + i * 130, 0.16, 0.1));
    },
    // A banda: sino (kane) em todo tempo, tambor grave no começo de cada compasso e a flauta a
    // partir do segundo compasso. `start`: instante do tempo zero no relógio do áudio
    music(start, bpm, beats) {
      const beat = 60 / bpm;
      for (let b = 0; b < beats; b += 1) {
        const at = start + b * beat;
        burst(at, 0.07, 3700, 0.2, 'bandpass', 9, band);
        burst(at + beat * 0.5, 0.05, 4300, 0.09, 'bandpass', 9, band);
        if (b % 2 === 1) burst(at + beat * 0.75, 0.04, 4300, 0.07, 'bandpass', 9, band);
        if (b % 4 === 0) thump(at, 95, 48, 0.4, 0.4, band);
        else if (b % 4 === 2) thump(at, 85, 48, 0.3, 0.2, band);
      }
      let at = start + 4 * beat;
      let i = 0;
      const end = start + (beats - 2) * beat;
      while (at < end) {
        const [midi, len] = FLUTE[i % FLUTE.length];
        flute(at, midi, len * beat * 0.96);
        at += len * beat;
        i += 1;
      }
    },
    dispose: () => ctx.close().catch(() => {}),
  };
}

const TEXT = {
  pt: {
    label: 'Taiko: o jogo do festival', title: 'Taiko do festival', lead: 'Bata no tambor no ritmo da música. Cada nota corre pela pista até o círculo: acerte a batida quando ela chegar.',
    don: ['Don', 'nota vermelha: o centro do tambor'], ka: ['Ka', 'nota azul: a borda do tambor'], big: ['Nota grande', 'vale o dobro'],
    touchDon: 'toque na metade esquerda', touchKa: 'toque na metade direita',
    rules: [['良', 'Em cheio', '100 pontos'], ['可', 'Quase', '50 pontos'], ['不可', 'Errou', 'zera a sequência']],
    combo: 'A cada 10 batidas seguidas os pontos sobem 10%, até o dobro. Encha a barra 魂 (alma) até a marca para passar.',
    level: 'Nível', best: 'Recorde', start: 'Começar', close: 'Fechar', restart: 'Recomeçar', score: 'Pontos', soul: 'Alma',
    again: 'Jogar de novo', change: 'Trocar de nível', back: 'Voltar à montanha', pass: 'Passou!', fail: 'Faltou pouco', record: 'Novo recorde!',
    good: 'em cheio', ok: 'quase', miss: 'erros', maxCombo: 'maior sequência', notes: 'notas',
  },
  en: {
    label: 'Taiko: the festival game', title: 'Festival taiko', lead: 'Hit the drum to the beat of the music. Each note runs along the lane to the circle: strike when it gets there.',
    don: ['Don', 'red note: the centre of the drum'], ka: ['Ka', 'blue note: the rim of the drum'], big: ['Big note', 'worth double'],
    touchDon: 'tap the left half', touchKa: 'tap the right half',
    rules: [['良', 'Perfect', '100 points'], ['可', 'Close', '50 points'], ['不可', 'Miss', 'resets the combo']],
    combo: 'Every 10 hits in a row raise the points by 10%, up to double. Fill the 魂 (soul) bar up to the mark to clear.',
    level: 'Level', best: 'Best', start: 'Start', close: 'Close', restart: 'Restart', score: 'Score', soul: 'Soul',
    again: 'Play again', change: 'Change level', back: 'Back to the mountain', pass: 'Cleared!', fail: 'So close', record: 'New record!',
    good: 'perfect', ok: 'close', miss: 'misses', maxCombo: 'best combo', notes: 'notes',
  },
};

function NoteIcon({ type, big = false }) {
  const r = big ? 17 : 13;
  return (
    <svg viewBox="-20 -20 40 40" width="40" height="40" aria-hidden="true">
      <circle r={r + 2.5} fill="#f3eee3" />
      <circle r={r} fill={NOTE[type]} stroke="#14141a" strokeWidth="1.5" />
      <circle r={r * 0.55} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
    </svg>
  );
}

export default function Taiko({ onDone }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const scoreRef = useRef(null);
  const soulRef = useRef(null);
  const [phase, setPhase] = useState('intro');
  const [levelId, setLevelId] = useState('kantan');
  const [round, setRound] = useState(0);
  const [result, setResult] = useState(null);
  const [best, setBest] = useState({});
  const lang = typeof document !== 'undefined' && document.documentElement.getAttribute('data-language') === 'en' ? 'en' : 'pt';
  const t = TEXT[lang];
  const level = TAIKO_LEVELS.find((l) => l.id === levelId) ?? TAIKO_LEVELS[0];

  useEffect(() => { setBest(readBest(window.localStorage)); }, []);

  // Esc fecha em qualquer tela; a rolagem da página fica parada por baixo
  useEffect(() => {
    const root = rootRef.current;
    window.dispatchEvent(new CustomEvent('oku:pet-festival', { detail: { mode: 'taiko' } }));
    const onKey = (e) => { if (e.key === 'Escape') onDone(); };
    const block = (e) => { if (!e.target.closest?.('.taiko-card')) e.preventDefault(); };
    window.addEventListener('keydown', onKey);
    root.addEventListener('wheel', block, { passive: false });
    root.addEventListener('touchmove', block, { passive: false });
    return () => {
      window.dispatchEvent(new CustomEvent('oku:pet-festival', { detail: { mode: null } }));
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('wheel', block);
      root.removeEventListener('touchmove', block);
    };
  }, [onDone]);

  useEffect(() => {
    if (phase === 'play') return;
    rootRef.current?.querySelector(phase === 'intro' ? '.taiko-start' : '.taiko-again')?.focus();
  }, [phase]);

  // A partida
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const sound = createSound();
    const clock = sound ? sound.now : () => performance.now() / 1000;
    const start = clock() + 0.15;
    const beat = 60 / level.bpm;
    const notes = levelChart(level);
    const total = notes.length;
    const lead = TAIKO.leadBeats * beat;
    const endAt = notes[total - 1].time + 1.4;
    sound?.music(start, level.bpm, Math.ceil(endAt / beat) + 2);

    const sparks = [];
    const pops = [];
    const flying = [];
    const rings = [];
    const stats = { goods: 0, oks: 0, misses: 0, combo: 0, best: 0, score: 0, soul: 0 };
    let shown = { score: -1, soul: -1 };
    let drumHit = 0;
    let drumType = 'don';
    let comboPop = 0;
    let done = false;
    let raf = 0;
    let last = performance.now() / 1000;
    // O companheiro dança em cada tempo, já na contagem antes da primeira nota
    let petBeat = null;

    // Pista no meio da tela; o tambor à esquerda, o alvo logo depois dele
    const layout = () => {
      const laneH = clamp(h * 0.17, 86, 132);
      const y = Math.round(h * (touch ? 0.47 : 0.45));
      const panel = clamp(w * 0.2, 92, 190);
      const r = laneH * 0.29;
      return { laneH, y, panel, r, tx: panel + r * 2.2 };
    };
    const firework = (x, y, n, speed) => {
      const count = Math.round(n * (reduced ? 0.4 : 1));
      const color = SPARKS[Math.floor(Math.random() * SPARKS.length)];
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.2;
        const v = speed * (0.45 + Math.random() * 0.6);
        sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, fade: 0.9 + Math.random() * 0.6, color });
      }
    };
    const miss = () => {
      stats.misses += 1;
      stats.combo = 0;
      stats.soul = clamp(stats.soul + soulStep('miss', total), 0, 1);
    };

    const hit = (type) => {
      if (done) return;
      const now = clock() - start;
      const l = layout();
      drumHit = 1;
      drumType = type;
      const judged = judgeHit(notes, type, now);
      const note = judged ? notes[judged.index] : null;
      sound?.[type](note?.big);
      if (!judged) return;
      note.state = 'hit';
      stats.combo += 1;
      stats.best = Math.max(stats.best, stats.combo);
      stats[judged.grade === 'good' ? 'goods' : 'oks'] += 1;
      stats.score += hitScore(judged.grade, stats.combo, note.big);
      stats.soul = clamp(stats.soul + soulStep(judged.grade, total), 0, 1);
      comboPop = 1;
      pops.push({ text: judged.grade === 'good' ? '良' : '可', life: 1 });
      rings.push({ life: 1, color: judged.grade === 'good' ? '#ffd27a' : '#e8ecf5', big: note.big });
      flying.push({ type: note.type, big: note.big, t: 0 });
      firework(l.tx, l.y, judged.grade === 'good' ? 16 : 8, 240);
      // Sequência redonda: um fogo no fundo e um viva
      if (stats.combo % 10 === 0) {
        firework(w * (0.3 + Math.random() * 0.55), h * (0.12 + Math.random() * 0.14), 60, 300);
        sound?.cheer();
      }
    };

    const onKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (DON_KEYS.has(key)) { e.preventDefault(); hit('don'); } else if (KA_KEYS.has(key)) { e.preventDefault(); hit('ka'); } else if (key === 'r') setRound((n) => n + 1);
    };
    // Toque e mouse: metade esquerda da tela é don, metade direita é ka
    const onPointer = (e) => {
      if (e.target.closest('button, a')) return;
      hit(e.clientX < w / 2 ? 'don' : 'ka');
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    root.addEventListener('pointerdown', onPointer);

    const drawNote = (x, y, r, type, big, alpha = 1) => {
      const rr = big ? r * 1.38 : r;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, rr + 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f3eee3';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fillStyle = NOTE[type];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#14141a';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, rr * 0.58, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${Math.round(rr * 0.56)}px sans-serif`;
      ctx.fillText(KANA[type], x, y + 1);
      ctx.restore();
    };

    // 提灯: a fileira de lanternas de festival no alto; acendem a cada tempo da música
    const drawGarland = (pulse) => {
      const top = 74;
      const n = Math.max(5, Math.round(w / 120));
      ctx.strokeStyle = 'rgba(243, 238, 227, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= 40; i += 1) {
        const k = i / 40;
        const yy = top + Math.sin(k * Math.PI * n) ** 2 * -10 + 14;
        if (i === 0) ctx.moveTo(k * w, yy); else ctx.lineTo(k * w, yy);
      }
      ctx.stroke();
      for (let i = 0; i < n; i += 1) {
        const x = ((i + 0.5) / n) * w;
        const y = top + 34;
        const glow = 0.35 + 0.65 * pulse * (i % 2 === 0 ? 1 : 0.6);
        const g = ctx.createRadialGradient(x, y, 2, x, y, 46);
        g.addColorStop(0, `rgba(255, 150, 80, ${0.42 * glow})`);
        g.addColorStop(1, 'rgba(255, 150, 80, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 46, y - 46, 92, 92);
        ctx.fillStyle = `rgb(${Math.round(150 + 80 * glow)}, ${Math.round(40 + 30 * glow)}, ${Math.round(30 + 14 * glow)})`;
        ctx.beginPath();
        ctx.ellipse(x, y, 13, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 226, 170, ${0.3 + 0.5 * glow})`;
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16161c';
        ctx.fillRect(x - 7, y - 20, 14, 4);
        ctx.fillRect(x - 7, y + 16, 14, 4);
      }
    };

    // O palco do festival embaixo da pista: o 祭 em marca d'água, pulsando no tempo, e a 紅白幕
    // (a cortina de listras vermelhas e brancas) na borda de baixo
    const drawStage = (l, pulse) => {
      const bottom = l.y + l.laneH / 2;
      const room = h - bottom - (touch ? 150 : 50);
      if (room > 120) {
        const size = Math.min(room * 0.9, w * 0.34);
        ctx.fillStyle = `rgba(243, 238, 227, ${0.045 + pulse * 0.03})`;
        ctx.font = `800 ${Math.round(size * (1 + pulse * 0.02))}px serif`;
        ctx.fillText('祭', w / 2, bottom + room / 2 + 6);
      }
      if (touch) return;
      const band = 46;
      const stripe = 46;
      for (let x = 0, i = 0; x < w; x += stripe, i += 1) {
        ctx.fillStyle = i % 2 === 0 ? '#a8241d' : '#e9e2d2';
        ctx.fillRect(x, h - band, stripe, band);
      }
      ctx.fillStyle = '#14141a';
      ctx.fillRect(0, h - band - 5, w, 5);
      const shade = ctx.createLinearGradient(0, h - band, 0, h);
      shade.addColorStop(0, 'rgba(8, 10, 22, 0.15)');
      shade.addColorStop(1, 'rgba(8, 10, 22, 0.6)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, h - band, w, band);
    };

    const drawDrum = (l) => {
      const x = l.panel / 2;
      const R = l.laneH * 0.44 * (1 + drumHit * 0.06);
      // Corpo de madeira com os cravos, pele clara e o 三つ巴 no meio
      ctx.beginPath();
      ctx.arc(x, l.y, R, 0, Math.PI * 2);
      ctx.fillStyle = drumHit > 0.05 && drumType === 'ka' ? '#3f7fc4' : '#6b2a18';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#14141a';
      ctx.stroke();
      ctx.fillStyle = '#d9b46a';
      for (let i = 0; i < 14; i += 1) {
        const a = (i / 14) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * R * 0.88, l.y + Math.sin(a) * R * 0.88, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, l.y, R * 0.76, 0, Math.PI * 2);
      ctx.fillStyle = drumHit > 0.05 && drumType === 'don' ? '#ffb199' : '#efe6d2';
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 20, 26, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(122, 31, 26, 0.85)';
      for (let i = 0; i < 3; i += 1) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const cx = x + Math.cos(a) * R * 0.3;
        const cy = l.y + Math.sin(a) * R * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.17, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, l.y, R * 0.47, a + 0.25, a + 1.5);
        ctx.arc(x, l.y, R * 0.3, a + 1.5, a + 0.2, true);
        ctx.fill();
      }
      // 撥: as baquetas, que descem na batida
      const swing = drumHit;
      [[-1, 'don'], [1, 'ka']].forEach(([side, type]) => {
        const active = drumType === type ? swing : 0;
        ctx.save();
        ctx.translate(x + side * R * 0.95, l.y - R * 1.15);
        ctx.rotate(side * (0.75 - active * 0.55));
        ctx.fillStyle = '#e9d7b0';
        ctx.strokeStyle = '#14141a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-4, -4, 8, R * 1.05, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });
    };

    const tick = () => {
      const real = performance.now() / 1000;
      const dt = Math.min(1 / 30, real - last);
      last = real;
      const now = clock() - start;
      const nextPetBeat = Math.floor(now / beat);
      if (nextPetBeat !== petBeat) {
        petBeat = nextPetBeat;
        window.dispatchEvent(new CustomEvent('oku:pet-festival', { detail: { mode: 'taiko', pulse: true } }));
      }
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const l = layout();
      const beatPos = now / beat;
      const pulse = now < 0 ? 0 : Math.exp(-(beatPos - Math.floor(beatPos)) * 3.2);
      drawGarland(reduced ? 0.6 : pulse);
      drawStage(l, reduced ? 0 : pulse);

      // Fogos do fundo (sequências de 10) e faíscas do alvo
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const p = sparks[i];
        p.px = p.x;
        p.py = p.y;
        p.vx *= 1 - 2.2 * dt;
        p.vy = p.vy * (1 - 2.2 * dt) + 260 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * p.fade;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.life * 1.4);
        ctx.lineWidth = 1 + p.life * 1.8;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // A pista: faixa de laca escura com filetes dourados; o painel vermelho do tambor à esquerda
      const top = l.y - l.laneH / 2;
      ctx.fillStyle = 'rgba(10, 11, 22, 0.92)';
      ctx.fillRect(0, top, w, l.laneH);
      ctx.fillStyle = '#c9a24a';
      ctx.fillRect(0, top - 3, w, 3);
      ctx.fillRect(0, top + l.laneH, w, 3);
      // Linhas de compasso, correndo junto com as notas
      const span = w - l.tx + l.r * 2;
      const bar = beat * 4;
      ctx.strokeStyle = 'rgba(243, 238, 227, 0.16)';
      ctx.lineWidth = 1;
      for (let b = Math.ceil(now / bar); b * bar < now + TAIKO.travel; b += 1) {
        if (b * bar < lead - 1e-6) continue;
        const x = l.tx + ((b * bar - now) / TAIKO.travel) * span;
        ctx.beginPath();
        ctx.moveTo(x, top + 4);
        ctx.lineTo(x, top + l.laneH - 4);
        ctx.stroke();
      }
      ctx.fillStyle = '#8f1d18';
      ctx.fillRect(0, top, l.panel, l.laneH);
      ctx.fillStyle = '#c9a24a';
      ctx.fillRect(l.panel, top, 3, l.laneH);
      // O alvo
      ctx.beginPath();
      ctx.arc(l.tx, l.y, l.r + 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(243, 238, 227, 0.1)';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(243, 238, 227, 0.8)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(l.tx, l.y, l.r * 1.38 + 5, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(243, 238, 227, 0.3)';
      ctx.stroke();

      // Notas: as mais próximas do alvo por cima; as que passaram sem batida apagam
      for (let i = notes.length - 1; i >= 0; i -= 1) {
        const n = notes[i];
        if (n.state === 'hit') continue;
        const gap = n.time - now;
        if (n.state === 'pending' && gap < -TAIKO.ok) {
          n.state = 'miss';
          miss();
          pops.push({ text: '不可', life: 1 });
        }
        if (gap > TAIKO.travel || gap < -0.45) continue;
        const x = l.tx + (gap / TAIKO.travel) * span;
        if (x < l.panel - l.r) continue;
        drawNote(x, l.y, l.r, n.type, n.big, n.state === 'miss' ? Math.max(0, 0.45 + gap) : 1);
      }
      drumHit = Math.max(0, drumHit - dt * 6);
      drawDrum(l);

      // Anel do acerto e a nota batida voando para o placar
      for (let i = rings.length - 1; i >= 0; i -= 1) {
        const r = rings[i];
        r.life -= dt * 3.4;
        if (r.life <= 0) { rings.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(l.tx, l.y, (r.big ? l.r * 1.38 : l.r) + 6 + (1 - r.life) * 34, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.life;
        ctx.lineWidth = 2 + r.life * 5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      for (let i = flying.length - 1; i >= 0; i -= 1) {
        const f = flying[i];
        f.t += dt / 0.42;
        if (f.t >= 1) { flying.splice(i, 1); continue; }
        const x = l.tx + (w * 0.86 - l.tx) * f.t;
        const y = l.y + (64 - l.y) * f.t - Math.sin(f.t * Math.PI) * 60;
        drawNote(x, y, l.r * (1 - f.t * 0.45), f.type, f.big, 1 - f.t * f.t);
      }
      // 良 / 可 / 不可 acima do alvo
      for (let i = pops.length - 1; i >= 0; i -= 1) {
        const p = pops[i];
        p.life -= dt * 2;
        if (p.life <= 0) { pops.splice(i, 1); continue; }
        const scale = 1 + Math.max(0, p.life - 0.8) * 2.2;
        ctx.globalAlpha = Math.min(1, p.life * 1.6);
        ctx.fillStyle = p.text === '良' ? '#ffd27a' : p.text === '可' ? '#f3eee3' : '#8ea2c8';
        ctx.font = `800 ${Math.round(34 * scale)}px serif`;
        ctx.fillText(p.text, l.tx, top - 34 - (1 - p.life) * 16);
        ctx.globalAlpha = 1;
      }
      // Sequência, acima do tambor
      comboPop = Math.max(0, comboPop - dt * 5);
      if (stats.combo > 1) {
        ctx.fillStyle = stats.combo >= 10 ? '#ffd27a' : '#f3eee3';
        ctx.font = `800 ${Math.round(40 * (1 + comboPop * 0.25))}px sans-serif`;
        ctx.fillText(String(stats.combo), l.panel / 2, top - 58);
        ctx.font = '600 12px sans-serif';
        ctx.fillStyle = 'rgba(243, 238, 227, 0.7)';
        ctx.fillText('COMBO', l.panel / 2, top - 26);
      }
      // Contagem: 三 二 一 nos últimos tempos antes da primeira nota
      const toFirst = (lead - now) / beat;
      if (toFirst > 0 && toFirst <= 4) {
        const n = Math.ceil(toFirst);
        const k = n - toFirst;
        ctx.globalAlpha = Math.max(0, 1 - k * 0.9);
        ctx.fillStyle = '#f3eee3';
        ctx.font = `800 ${Math.round(l.laneH * 0.62 * (1.25 - k * 0.25))}px serif`;
        ctx.fillText(n === 4 ? '構' : ['一', '二', '三'][n - 1], l.tx + span * 0.45, l.y + 2);
        ctx.globalAlpha = 1;
      }
      // Toque: as duas metades da tela, marcadas embaixo
      if (touch) {
        const py = h - 86;
        [['don', 0, 'ドン  DON'], ['ka', w / 2, 'カッ  KA']].forEach(([type, x, label]) => {
          const active = drumType === type ? drumHit : 0;
          ctx.fillStyle = NOTE[type];
          ctx.globalAlpha = 0.28 + active * 0.5;
          ctx.fillRect(x + 8, py - 62, w / 2 - 16, 124);
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#fff';
          ctx.font = '700 18px sans-serif';
          ctx.fillText(label, x + w / 4, py);
          ctx.globalAlpha = 1;
        });
      }

      // Placar e barra da alma (no DOM, só quando mudam)
      if (shown.score !== stats.score) {
        shown.score = stats.score;
        if (scoreRef.current) scoreRef.current.textContent = String(stats.score).padStart(6, '0');
      }
      if (shown.soul !== stats.soul) {
        shown.soul = stats.soul;
        if (soulRef.current) {
          soulRef.current.style.setProperty('--soul', String(stats.soul));
          soulRef.current.toggleAttribute('data-clear', stats.soul >= TAIKO.clear);
        }
      }

      if (!done && now > endAt) {
        done = true;
        const saved = saveBest(window.localStorage, level.id, stats.score);
        setBest(saved.best);
        setResult({
          ...stats, total, levelId: level.id, record: saved.record && stats.score > 0,
          rank: taikoRank(stats.goods, stats.oks, total), clear: stats.soul >= TAIKO.clear,
        });
        setPhase('result');
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      root.removeEventListener('pointerdown', onPointer);
      ctx.clearRect(0, 0, w, h);
      sound?.dispose();
    };
  }, [phase, level, round]);

  const play = () => { setResult(null); setRound((n) => n + 1); setPhase('play'); };

  return (
    <div ref={rootRef} className="taiko" data-taiko="" data-phase={phase} role="dialog" aria-modal="true" aria-label={t.label}>
      <canvas ref={canvasRef} className="taiko-canvas" aria-hidden="true" />
      <p className="taiko-title font-jp" lang="ja" aria-hidden="true">太鼓</p>
      <div className="taiko-top">
        {phase === 'play' ? <button type="button" className="taiko-btn" data-taiko-restart="" onClick={() => setRound((n) => n + 1)}>{t.restart} <kbd>R</kbd></button> : null}
        <button type="button" className="taiko-btn taiko-close" onClick={onDone}>{t.close} <kbd>Esc</kbd></button>
      </div>

      {phase === 'play' ? (
        <>
          <div className="taiko-hud">
            <p className="taiko-level"><span className="font-jp" lang="ja">{level.jp}</span> {level.name[lang]}</p>
            <div ref={soulRef} className="taiko-soul" role="img" aria-label={t.soul}>
              <span className="taiko-soul-fill" />
              <span className="taiko-soul-mark" style={{ left: `${TAIKO.clear * 100}%` }} />
              <span className="taiko-soul-kanji font-jp" lang="ja" aria-hidden="true">魂</span>
            </div>
            <p className="taiko-score"><span>{t.score}</span> <b ref={scoreRef} data-taiko-score="">000000</b></p>
          </div>
          <p className="taiko-keys">
            <span><kbd>F</kbd><kbd>J</kbd> don</span>
            <span><kbd>D</kbd><kbd>K</kbd> ka</span>
          </p>
        </>
      ) : null}

      {phase === 'intro' ? (
        <div className="taiko-card" data-taiko-intro="">
          <h2 className="taiko-card-title"><span className="font-jp" lang="ja" aria-hidden="true">祭 </span>{t.title}</h2>
          <p className="taiko-lead">{t.lead}</p>
          <ul className="taiko-how">
            <li><NoteIcon type="don" /><span><b>{t.don[0]}</b> {t.don[1]}<span className="taiko-how-keys"><kbd>F</kbd><kbd>J</kbd></span><span className="taiko-how-touch">{t.touchDon}</span></span></li>
            <li><NoteIcon type="ka" /><span><b>{t.ka[0]}</b> {t.ka[1]}<span className="taiko-how-keys"><kbd>D</kbd><kbd>K</kbd></span><span className="taiko-how-touch">{t.touchKa}</span></span></li>
            <li><NoteIcon type="don" big /><span><b>{t.big[0]}</b> {t.big[1]}</span></li>
          </ul>
          <ul className="taiko-rules">
            {t.rules.map(([kanji, name, text]) => (
              <li key={kanji}><span className="font-jp" lang="ja" aria-hidden="true">{kanji}</span><b>{name}</b><span>{text}</span></li>
            ))}
          </ul>
          <p className="taiko-combo-rule">{t.combo}</p>
          <div className="taiko-levels" role="radiogroup" aria-label={t.level}>
            {TAIKO_LEVELS.map((l) => (
              <button key={l.id} type="button" role="radio" aria-checked={l.id === levelId} className="taiko-level-option" data-taiko-level={l.id} onClick={() => setLevelId(l.id)}>
                <span className="font-jp" lang="ja" aria-hidden="true">{l.jp}</span>
                <b>{l.name[lang]}</b>
                <span className="taiko-level-best">{best[l.id] ? `${t.best} ${best[l.id]}` : `${l.bpm} bpm`}</span>
              </button>
            ))}
          </div>
          <button type="button" className="taiko-start" onClick={play}>{t.start}</button>
        </div>
      ) : null}

      {phase === 'result' && result ? (
        <div className="taiko-card taiko-result" role="status" data-taiko-result="">
          <p className="taiko-verdict" data-clear={result.clear ? '' : undefined}><span className="font-jp" lang="ja" aria-hidden="true">{result.clear ? '合格' : '不合格'}</span> {result.clear ? t.pass : t.fail}</p>
          <p className="taiko-rank font-jp" lang="ja">{result.rank}</p>
          <p className="taiko-final">{result.score}</p>
          <p className="taiko-record">{result.record ? t.record : `${t.best}: ${best[result.levelId] ?? result.score}`}</p>
          <dl className="taiko-stats">
            <div><dt><span className="font-jp" lang="ja" aria-hidden="true">良</span> {t.good}</dt><dd>{result.goods}</dd></div>
            <div><dt><span className="font-jp" lang="ja" aria-hidden="true">可</span> {t.ok}</dt><dd>{result.oks}</dd></div>
            <div><dt><span className="font-jp" lang="ja" aria-hidden="true">不可</span> {t.miss}</dt><dd>{result.misses}</dd></div>
            <div><dt>{t.maxCombo}</dt><dd>{result.best}</dd></div>
          </dl>
          <div className="taiko-actions">
            <button type="button" className="taiko-again" onClick={play}>{t.again}</button>
            <button type="button" onClick={() => setPhase('intro')}>{t.change}</button>
            <button type="button" onClick={onDone}>{t.back}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
