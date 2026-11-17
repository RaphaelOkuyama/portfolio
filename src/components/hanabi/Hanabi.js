'use client';
import { useEffect, useRef, useState } from 'react';
import { festival, launchFirework, launchNiagara, setFestival } from '../../lib/festival';
import { HANABI, HANABI_ACTS, hanabiProgram } from '../../lib/hanabi';

// 花火大会: o festival de fogos (palavra secreta "hanabi"; carregado só então, ver EasterEggs).
// Com a cena 3D na tela, a página some, a câmera voa até o rio e os fogos sobem no céu atrás da
// taikobashi (ver scene/Fireworks), num programa em atos como o dos festivais do Japão: abertura,
// formas, starmine, senrin, a Niágara na ponte, a casca gigante que vira várias, o final dourado
// e o ōtori: uma bolinha só que abre do tamanho da tela e vira dezenas de flores. Tudo em câmera
// lenta (HANABI.slow), para dar tempo de ver cada fogo abrir e cair.
// Sem a cena 3D (sem placa de vídeo), o mesmo programa é desenhado aqui, por cima da página

const COLORS = [
  ['#ffe2a0', '#ff7a2e'], ['#ffa3bd', '#ff2e63'], ['#b4ecff', '#3f8cff'], ['#d2ffbd', '#3fd67a'], ['#ecd0ff', '#9a5cff'], ['#fff6dc', '#ffcf70'],
];
const GOLD = ['#ffe9b0', '#ff9a3c'];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Som dos fogos, sintetizado: o assobio da subida, o estouro (grave conforme o tamanho) e o chiado
function createSound() {
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const burst = (dur, freq, gain, type = 'lowpass', q = 0.7, delay = 0) => {
    const at = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, at);
    if (type === 'lowpass') filter.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.25), at + dur);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    src.connect(filter).connect(g).connect(master);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.05);
  };
  return {
    boom(kind) {
      if (kind === 'crackle') {
        burst(0.18, 5200, 0.1, 'highpass');
        return;
      }
      const size = kind === 'otori' ? 2.6 : kind === 'giant' ? 2 : kind === 'big' ? 1.3 : 1;
      burst(0.5 * size, 420 / size, 0.55 * Math.min(1.5, size), 'lowpass');
      burst(0.12, 1800, 0.22, 'bandpass', 0.8);
      burst(0.7 * size, 4200, 0.07 * size, 'highpass', 0.7, 0.1);
      if (kind === 'giant' || kind === 'otori') burst(kind === 'otori' ? 2.6 : 1.6, kind === 'otori' ? 90 : 120, 0.8, 'lowpass', 0.7, 0.02);
      // O chiado longo das faíscas do ōtori se abrindo pelo céu
      if (kind === 'otori') burst(2.4, 6000, 0.12, 'highpass', 0.7, 0.9);
    },
    niagara(seconds) {
      const at = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.09, at + 0.8);
      g.gain.setValueAtTime(0.09, at + seconds - 1);
      g.gain.exponentialRampToValueAtTime(0.0001, at + seconds + 0.6);
      src.connect(filter).connect(g).connect(master);
      src.start(at);
      src.stop(at + seconds + 0.7);
    },
    dispose: () => ctx.close().catch(() => {}),
  };
}

// Fogos em Canvas 2D, para quando não há cena 3D: o mesmo pedido ({ kind, x, y, big }) vira uma
// casca que sobe e estoura por cima da página
function createPainter(canvas, onBurst) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
  const shells = [];
  const sparks = [];
  const later = [];
  let clock = 0;
  let niagaraUntil = 0;
  const unit = () => Math.min(w, h) / 100;
  const ball = (x, y, n, speed, life, colors, o = {}) => {
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.1;
      const v = speed * unit() * (o.even ? 1 : rand(0.5, 1.05));
      sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, fade: 1 / (life * rand(0.85, 1.1)), color: colors[i % 2], drag: o.drag ?? 1.7, grav: (o.grav ?? 9) * unit(), width: o.width ?? 1.6 });
    }
  };
  const explode = (s) => {
    const k = s.big ? 1.3 : 1;
    const c = s.colors;
    if (s.kind === 'otori') {
      // Do meio da tela até os cantos, e depois flores menores espalhadas pela tela toda
      const R = Math.hypot(w, h) / 2 / unit();
      ball(s.x, s.y, 320, R * 1.6, 3, ['#ffffff', '#ffc86a'], { even: true, drag: 1.6, grav: 2, width: 2.2 });
      for (let i = 0; i < 9; i += 1) {
        for (let j = 0; j < 6; j += 1) {
          const x = w * ((i + 0.5 + rand(-0.3, 0.3)) / 9);
          const y = h * ((j + 0.5 + rand(-0.3, 0.3)) / 6);
          const d = Math.hypot(x - s.x, y - s.y) / (R * unit());
          later.push({ at: clock + 1 + d * 1.3 + rand(0, 0.25), x, y, kind: 'hana', colors: pick(COLORS), quiet: (i + j) % 5 !== 0 });
        }
      }
    } else if (s.kind === 'hana') ball(s.x, s.y, 40, 22, 1.6, c);
    else if (s.kind === 'giant') {
      ball(s.x, s.y, 150, 62, 2.4, c, { even: true });
      ball(s.x, s.y, 80, 30, 2, pick(COLORS));
      for (let i = 0; i < 22; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const r = rand(18, 26) * unit();
        later.push({ at: clock + rand(0.9, 1.4), x: s.x + Math.cos(a) * r, y: s.y + Math.sin(a) * r, kind: 'child', colors: pick(COLORS), quiet: i % 4 !== 0 });
      }
    } else if (s.kind === 'child' || s.kind === 'mini') ball(s.x, s.y, 26, 12, 1.1, c);
    else if (s.kind === 'senrin') {
      for (let i = 0; i < 10; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const r = rand(5, 14) * unit();
        later.push({ at: clock + rand(0.3, 0.9), x: s.x + Math.cos(a) * r, y: s.y + Math.sin(a) * r, kind: 'mini', colors: pick(COLORS), quiet: i % 3 !== 0 });
      }
    } else if (s.kind === 'yanagi' || s.kind === 'kamuro') ball(s.x, s.y, 80 * k, 30 * k, 3.4, GOLD, { drag: 1.0, grav: 16, width: 1.2 });
    else if (s.kind === 'ring') ball(s.x, s.y, 56, 30 * k, 1.8, c, { even: true });
    else if (s.kind === 'heart') {
      for (let i = 0; i < 64; i += 1) {
        const a = (i / 64) * Math.PI * 2;
        const hx = 16 * Math.sin(a) ** 3;
        const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        sparks.push({ x: s.x, y: s.y, px: s.x, py: s.y, vx: hx * 1.9 * unit(), vy: hy * 1.9 * unit(), life: 1, fade: 0.55, color: '#ff5c86', drag: 1.8, grav: 3 * unit(), width: 2 });
      }
    } else {
      ball(s.x, s.y, 70 * k, 34 * k, 2, c);
      if (s.kind === 'double') ball(s.x, s.y, 40, 17, 1.5, pick(COLORS));
    }
    if (!s.quiet) onBurst(s.kind === 'mini' || s.kind === 'child' || s.kind === 'hana' ? 'crackle' : s.kind === 'otori' ? 'otori' : s.kind === 'giant' ? 'giant' : s.big ? 'big' : 'small');
  };
  return {
    resize,
    launch(req) {
      const big = Boolean(req.big || req.finale);
      const kind = req.kind ?? (req.finale ? pick(['yanagi', 'senrin', 'kiku', 'double']) : big ? pick(['kiku', 'ring', 'double']) : 'kiku');
      const top = kind === 'otori' ? h * 0.42 : h * (0.52 - 0.36 * (req.y ?? Math.random()));
      shells.push({ x: w * (0.5 + 0.42 * (req.x ?? rand(-1, 1))), to: top, t: 0, rise: req.rise ?? 0.75, big, kind, colors: COLORS[req.color] ?? pick(COLORS) });
    },
    niagara(seconds) { niagaraUntil = clock + seconds; },
    frame(dt) {
      clock += dt;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = shells.length - 1; i >= 0; i -= 1) {
        const s = shells[i];
        s.t += dt;
        const k = Math.min(1, s.t / s.rise);
        const y = h + (s.to - h) * (1 - (1 - k) ** 2);
        ctx.strokeStyle = 'rgba(255, 226, 170, 0.8)';
        ctx.lineWidth = s.kind === 'otori' ? 5 : 2;
        ctx.beginPath();
        ctx.moveTo(s.x, y + (s.kind === 'otori' ? 60 : 18));
        ctx.lineTo(s.x, y);
        ctx.stroke();
        if (k >= 1) {
          shells.splice(i, 1);
          explode({ ...s, y: s.to });
        }
      }
      for (let i = later.length - 1; i >= 0; i -= 1) {
        if (later[i].at > clock) continue;
        explode(later.splice(i, 1)[0]);
      }
      if (clock < niagaraUntil) {
        for (let i = 0; i < 6; i += 1) {
          const x = w * rand(0.18, 0.82);
          sparks.push({ x, y: h * 0.42, px: x, py: h * 0.42, vx: rand(-6, 6), vy: rand(0, 20), life: 1, fade: 0.7, color: '#ffe2a8', drag: 0.6, grav: 26 * unit(), width: 1.1 });
        }
      }
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const p = sparks[i];
        p.px = p.x;
        p.py = p.y;
        p.vx *= 1 - p.drag * dt;
        p.vy = p.vy * (1 - p.drag * dt) + p.grav * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * p.fade;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.life * 1.4);
        ctx.lineWidth = 0.6 + p.life * p.width;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
  };
}

export default function Hanabi({ onDone }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const [act, setAct] = useState(null);
  const [ended, setEnded] = useState(false);
  const [round, setRound] = useState(0);
  const [scene, setScene] = useState(false);
  // Clarão branco na tela inteira quando o ōtori abre
  const [flash, setFlash] = useState(0);
  const lang = typeof document !== 'undefined' && document.documentElement.getAttribute('data-language') === 'en' ? 'en' : 'pt';
  const en = lang === 'en';

  useEffect(() => {
    const root = rootRef.current;
    // A cena 3D assume se estiver na tela; senão os fogos são pintados aqui
    const three = setFestival(true);
    setScene(three);
    const sound = createSound();
    const onBurst = (kind) => {
      sound?.boom(kind);
      if (kind === 'otori') setFlash((n) => n + 1);
    };
    const painter = three ? null : createPainter(canvasRef.current, onBurst);
    if (three) {
      festival.onBurst = onBurst;
      festival.speed = HANABI.slow;
    }
    const launch = (req) => (three ? launchFirework(req) : painter.launch(req));
    const niagara = (seconds) => {
      if (three) launchNiagara(seconds);
      else painter.niagara(seconds * HANABI.slow);
      sound?.niagara(seconds);
    };

    // O programa: uma lista de instantes; cada um solta um fogo, a Niágara ou troca a legenda
    const program = hanabiProgram();
    let index = 0;
    let clock = 0;
    let raf = 0;
    let last = performance.now();
    const tick = () => {
      const real = performance.now();
      const dt = Math.min(1 / 20, (real - last) / 1000);
      last = real;
      clock += dt;
      while (index < program.length && program[index].t <= clock) {
        const step = program[index];
        index += 1;
        if (step.act !== undefined) setAct(step.act);
        else if (step.niagara) niagara(step.niagara);
        else if (step.end) setEnded(true);
        else launch(step.fire);
      }
      painter?.frame(dt * HANABI.slow);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e) => {
      if (e.key === 'Escape') { onDone(); return; }
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      // Espaço solta um fogo por conta de quem assiste
      if (e.key === ' ') { e.preventDefault(); launch({ big: Math.random() < 0.4 }); }
    };
    // Clique ou toque: um fogo naquela direção do céu
    const onPointer = (e) => {
      if (e.target.closest('button, a')) return;
      launch({ x: (e.clientX / window.innerWidth) * 2 - 1, y: 1 - e.clientY / (window.innerHeight * 0.7), big: Math.random() < 0.4 });
    };
    const block = (e) => e.preventDefault();
    const resize = () => painter?.resize();
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    root.addEventListener('pointerdown', onPointer);
    root.addEventListener('wheel', block, { passive: false });
    root.addEventListener('touchmove', block, { passive: false });
    root.querySelector('.hanabi-close')?.focus();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      root.removeEventListener('pointerdown', onPointer);
      root.removeEventListener('wheel', block);
      root.removeEventListener('touchmove', block);
      festival.onBurst = null;
      festival.speed = 1;
      setFestival(false);
      sound?.dispose();
    };
  }, [onDone, round]);

  const info = act === null ? null : HANABI_ACTS[act];
  return (
    <div ref={rootRef} className="hanabi" data-hanabi="" data-mode={scene ? 'scene' : 'page'} role="dialog" aria-modal="true" aria-label={en ? 'Fireworks festival' : 'Festival de fogos'}>
      <canvas ref={canvasRef} className="hanabi-canvas" aria-hidden="true" />
      {flash ? <div key={flash} className="hanabi-flash" aria-hidden="true" /> : null}
      <p className="hanabi-title font-jp" lang="ja" aria-hidden="true">花火大会</p>
      {info && !ended ? (
        <p key={act} className="hanabi-act" data-hanabi-act={info.id}>
          <span className="hanabi-act-jp font-jp" lang="ja">{info.jp}</span>
          <span className="hanabi-act-name">{info.name[lang]}</span>
          <span className="hanabi-act-text">{info.text[lang]}</span>
        </p>
      ) : null}
      {ended ? null : (
        <p className="hanabi-keys">
          <span className="hanabi-keys-mouse">{en ? 'Click the sky (or press space) to launch your own' : 'Clique no céu (ou aperte espaço) para soltar os seus'}</span>
          <span className="hanabi-keys-touch">{en ? 'Tap the sky to launch your own' : 'Toque no céu para soltar os seus'}</span>
        </p>
      )}
      <button type="button" className="hanabi-close" onClick={onDone}>{en ? 'Close' : 'Fechar'} <kbd>Esc</kbd></button>
      {ended ? (
        <div className="hanabi-result" role="status">
          <p className="hanabi-rank font-jp" lang="ja">玉屋</p>
          <p className="hanabi-score">Tamaya!</p>
          <p className="hanabi-detail">
            {en ? 'What the crowd shouts when a firework is beautiful. The sky is still yours: click it.' : 'É o que a plateia grita quando o fogo é bonito. O céu continua seu: clique nele.'}
          </p>
          <div className="hanabi-actions">
            <button type="button" onClick={() => { setEnded(false); setAct(null); setRound((r) => r + 1); }}>{en ? 'Again' : 'De novo'}</button>
            <button type="button" onClick={onDone}>{en ? 'Back to the mountain' : 'Voltar à montanha'}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
