'use client';
import { useEffect, useRef, useState } from 'react';
import { HANABI, hanabiChart, hanabiRank, judgeHit } from '../../lib/hanabi';

// 花火 · 太鼓: o festival secreto (carregado só quando alguém digita a palavra; ver EasterEggs).
// Notas em forma de lanterna correm pela pista até o tambor: don (centro) e ka (borda). Cada
// batida certa solta um fogo de artifício sobre a página; no fim, o final do festival e a nota

const COLORS = [
  ['#ffd27a', '#ff8a3c'], ['#ff9fb5', '#ff4f7a'], ['#a8e6ff', '#4aa8ff'], ['#c9ffb0', '#58d68d'], ['#e3c2ff', '#a56bff'], ['#fff6d6', '#ffffff'],
];
const NOTE = { don: '#d8402f', ka: '#3b6fb0' };
const DON_KEYS = new Set(['f', 'j', ' ']);
const KA_KEYS = new Set(['d', 'k']);

// Som do festival: o tambor (don grave, ka seco na borda) e o estouro dos fogos, tudo sintetizado
function createSound() {
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const burst = (dur, freq, gain, type = 'bandpass', q = 1) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(filter).connect(g).connect(master);
    src.start();
    src.stop(ctx.currentTime + dur);
  };
  return {
    now: () => ctx.currentTime,
    don() {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(150, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(52, ctx.currentTime + 0.22);
      g.gain.setValueAtTime(0.9, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.connect(g).connect(master);
      o.start();
      o.stop(ctx.currentTime + 0.42);
      burst(0.05, 900, 0.35);
    },
    ka() {
      burst(0.07, 2600, 0.6, 'bandpass', 4);
      burst(0.03, 6000, 0.25, 'highpass');
    },
    boom(big) {
      burst(big ? 0.55 : 0.4, 180, big ? 0.7 : 0.45, 'lowpass');
      setTimeout(() => burst(0.5, 4200, 0.12, 'highpass'), 90);
    },
    dispose: () => ctx.close().catch(() => {}),
  };
}

export default function Hanabi({ onDone }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);
  const lang = typeof document !== 'undefined' && document.documentElement.getAttribute('data-language') === 'en' ? 'en' : 'pt';

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    const sound = createSound();
    const clock = sound ? sound.now : () => performance.now() / 1000;
    const start = clock();
    const notes = hanabiChart();
    const total = notes.length;
    const endAt = notes[total - 1].time + 0.9;
    const shells = [];
    const sparks = [];
    const pops = [];
    let hits = 0;
    let goods = 0;
    let combo = 0;
    let best = 0;
    let drumHit = 0;
    let drumType = 'don';
    let finale = null;
    let done = false;
    let raf = 0;
    let last = performance.now() / 1000;
    const comboEl = root.querySelector('.hanabi-combo');

    const lane = () => ({ y: h - Math.min(150, h * 0.22), x: Math.max(84, w * 0.2), r: Math.min(44, w * 0.09) });
    const launch = (big, x = w * (0.14 + Math.random() * 0.72)) => {
      shells.push({ x, y: h, to: h * (0.14 + Math.random() * 0.34), vy: 0, t: 0, big, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    };
    const explode = (s) => {
      const n = Math.round((s.big ? 96 : 56) * (reduced ? 0.4 : 1));
      const speed = s.big ? 250 : 190;
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.08;
        const v = speed * (0.55 + Math.random() * 0.5);
        sparks.push({ x: s.x, y: s.y, px: s.x, py: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, fade: 0.55 + Math.random() * 0.35, color: s.color[i % 2] });
      }
      sound?.boom(s.big);
    };

    const hit = (type) => {
      if (done) return;
      const now = clock() - start;
      drumHit = 1;
      drumType = type;
      sound?.[type]();
      const judged = judgeHit(notes, type, now);
      if (!judged) return;
      notes[judged.index].state = 'hit';
      hits += 1;
      combo += 1;
      best = Math.max(best, combo);
      if (judged.grade === 'good') goods += 1;
      const l = lane();
      pops.push({ x: l.x, y: l.y - l.r - 18, text: judged.grade === 'good' ? '良' : '可', life: 1 });
      launch(judged.grade === 'good');
      comboEl.textContent = combo > 1 ? `${combo}` : '';
    };

    const onKey = (e) => {
      if (e.key === 'Escape') { onDone(); return; }
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (DON_KEYS.has(key)) { e.preventDefault(); hit('don'); } else if (KA_KEYS.has(key)) { e.preventDefault(); hit('ka'); }
    };
    // Toque e mouse: metade esquerda da tela é don, metade direita é ka
    const onPointer = (e) => {
      if (e.target.closest('button, a')) return;
      hit(e.clientX < w / 2 ? 'don' : 'ka');
    };
    const block = (e) => e.preventDefault();
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    root.addEventListener('pointerdown', onPointer);
    root.addEventListener('wheel', block, { passive: false });
    root.addEventListener('touchmove', block, { passive: false });

    const drawLantern = (x, y, type, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = NOTE[type];
      ctx.beginPath();
      ctx.ellipse(x, y, 15, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 236, 190, 0.55)';
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16161c';
      ctx.fillRect(x - 8, y - 23, 16, 5);
      ctx.fillRect(x - 8, y + 18, 16, 5);
      ctx.restore();
    };

    const tick = () => {
      const real = performance.now() / 1000;
      const dt = Math.min(1 / 30, real - last);
      last = real;
      const now = clock() - start;
      ctx.clearRect(0, 0, w, h);
      const l = lane();

      // Fogos: a casca sobe, estoura e as faíscas caem
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = shells.length - 1; i >= 0; i -= 1) {
        const s = shells[i];
        s.t += dt;
        const k = Math.min(1, s.t / 0.62);
        const y = h + (s.to - h) * (1 - (1 - k) ** 2);
        ctx.strokeStyle = 'rgba(255, 226, 170, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, y + 16);
        ctx.lineTo(s.x, y);
        ctx.stroke();
        if (k >= 1) {
          s.y = s.to;
          explode(s);
          shells.splice(i, 1);
        }
      }
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const p = sparks[i];
        p.px = p.x;
        p.py = p.y;
        p.vx *= 1 - 1.6 * dt;
        p.vy = p.vy * (1 - 1.6 * dt) + 150 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * p.fade;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.life * 1.4);
        ctx.lineWidth = 1 + p.life * 1.6;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      if (!finale) {
        // A pista: uma faixa de tinta, o alvo e o tambor
        ctx.fillStyle = 'rgba(8, 10, 20, 0.72)';
        ctx.fillRect(0, l.y - l.r - 10, w, l.r * 2 + 20);
        ctx.strokeStyle = 'rgba(243, 238, 227, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-2, l.y - l.r - 10, w + 4, l.r * 2 + 20);
        drumHit = Math.max(0, drumHit - dt * 5);
        const pulse = 1 + drumHit * 0.12;
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = drumHit > 0.05 && drumType === 'ka' ? '#3b6fb0' : '#7a1f1a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.r * 0.74 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = drumHit > 0.05 && drumType === 'don' ? '#ffe9c4' : '#efe6d2';
        ctx.fill();
        ctx.fillStyle = 'rgba(20, 20, 26, 0.75)';
        ctx.font = `700 ${Math.round(l.r * 0.7)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('祭', l.x, l.y + 2);

        // Notas: lanternas vindo da direita; as que passaram do alvo sem batida apagam
        const span = w - l.x + 40;
        notes.forEach((n) => {
          if (n.state === 'hit') return;
          const gap = n.time - now;
          if (n.state === 'pending' && gap < -HANABI.ok) {
            n.state = 'miss';
            combo = 0;
            comboEl.textContent = '';
          }
          if (gap > HANABI.travel || gap < -0.4) return;
          const x = l.x + (gap / HANABI.travel) * span;
          drawLantern(x, l.y, n.type, n.state === 'miss' ? Math.max(0, 0.5 + gap * 1.2) : 1);
        });
        for (let i = pops.length - 1; i >= 0; i -= 1) {
          const p = pops[i];
          p.life -= dt * 1.8;
          if (p.life <= 0) { pops.splice(i, 1); continue; }
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.text === '良' ? '#ffd27a' : '#cfd8ea';
          ctx.font = '700 26px serif';
          ctx.fillText(p.text, p.x, p.y - (1 - p.life) * 22);
          ctx.globalAlpha = 1;
        }
        // Fim da partitura: o final do festival, um fogo por batida certa (no mínimo cinco)
        if (now > endAt) {
          finale = { left: Math.max(5, Math.min(24, hits)), next: 0 };
          root.classList.add('is-finale');
        }
      } else if (!done) {
        finale.next -= dt;
        if (finale.left > 0 && finale.next <= 0) {
          launch(true);
          finale.left -= 1;
          finale.next = 0.16 + Math.random() * 0.14;
        }
        if (finale.left <= 0 && !shells.length && sparks.length < 30) {
          done = true;
          setResult({ hits, goods, total, best, rank: hanabiRank(hits, total) });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      root.removeEventListener('pointerdown', onPointer);
      root.removeEventListener('wheel', block);
      root.removeEventListener('touchmove', block);
      root.classList.remove('is-finale');
      sound?.dispose();
    };
  }, [onDone, round]);

  const en = lang === 'en';
  return (
    <div ref={rootRef} className="hanabi" data-hanabi="" role="dialog" aria-modal="true" aria-label={en ? 'Festival: taiko and fireworks' : 'Festival: taiko e fogos'}>
      <canvas ref={canvasRef} className="hanabi-canvas" aria-hidden="true" />
      <p className="hanabi-title font-jp" lang="ja" aria-hidden="true">花火</p>
      <p className="hanabi-combo" aria-hidden="true" />
      {result ? null : (
        <p className="hanabi-keys">
          <span><kbd>F</kbd><kbd>J</kbd> don</span>
          <span><kbd>D</kbd><kbd>K</kbd> ka</span>
          <span className="hanabi-keys-touch">{en ? 'touch: left don, right ka' : 'toque: esquerda don, direita ka'}</span>
        </p>
      )}
      <button type="button" className="hanabi-close" onClick={onDone}>{en ? 'Close' : 'Fechar'} <kbd>Esc</kbd></button>
      {result ? (
        <div className="hanabi-result" role="status">
          <p className="hanabi-rank font-jp" lang="ja">{result.rank}</p>
          <p className="hanabi-score">{result.hits} / {result.total}</p>
          <p className="hanabi-detail">
            {en ? `${result.goods} perfect · best combo ${result.best}` : `${result.goods} em cheio · maior sequência ${result.best}`}
          </p>
          <div className="hanabi-actions">
            <button type="button" onClick={() => { setResult(null); setRound((r) => r + 1); }}>{en ? 'Again' : 'De novo'}</button>
            <button type="button" onClick={onDone}>{en ? 'Back to the mountain' : 'Voltar à montanha'}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
