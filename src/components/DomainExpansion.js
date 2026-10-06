'use client';
import { useEffect, useRef, useState } from 'react';
import { resumeData } from '../data/resume';
import { DOMAIN, domainWords, shards, typedSecret } from '../lib/domain';

// 領域展開 · 無量空処: digitar "domain" (fora de campos) ou segurar o kanji 技 da placa do Stack
// fecha a tela num vazio cósmico: estrelas em túnel, um anel de luz no centro e uma enxurrada das
// ferramentas e números do portfólio voando na direção de quem olha (a "informação infinita").
// Depois de alguns segundos, Esc ou um clique, o domínio racha como vidro e os cacos caem.
// Tudo num canvas por cima da página; com movimento reduzido o vazio fica parado e some num fade

const NUMBERS = ['42+', '2.000+', '-70%', '-83%', '40+', '2FA', '24/7', '100%'];
const HOLD_SELECTOR = '[data-station="stack"] .section-kanji';

export default function DomainExpansion() {
  const [open, setOpen] = useState(null);
  const canvasRef = useRef(null);

  // Gatilhos: palavra secreta no teclado e segurar o kanji 技
  useEffect(() => {
    let buffer = '';
    let holdTimer = 0;
    let holding = null;
    const editable = (el) => Boolean(el?.closest?.('input, textarea, select, [contenteditable="true"]'));
    const onKey = (e) => {
      if (editable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const r = typedSecret(buffer, e.key);
      buffer = r.buffer;
      if (r.hit) {
        buffer = '';
        setOpen((o) => o ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    };
    const cancel = () => {
      clearTimeout(holdTimer);
      holding?.classList.remove('is-charging');
      holding = null;
    };
    const onDown = (e) => {
      const kanji = e.target?.closest?.(HOLD_SELECTOR);
      if (!kanji) return;
      holding = kanji;
      kanji.classList.add('is-charging');
      const { clientX: x, clientY: y } = e;
      holdTimer = setTimeout(() => {
        cancel();
        setOpen((o) => o ?? { x, y });
      }, DOMAIN.hold);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', cancel);
    window.addEventListener('pointercancel', cancel);
    return () => {
      cancel();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('pointercancel', cancel);
    };
  }, []);

  // O domínio aberto: animação no canvas até os cacos caírem
  useEffect(() => {
    if (!open) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lang = document.documentElement.getAttribute('data-language') === 'en' ? 'en' : 'pt';
    const words = domainWords(resumeData[lang].techSection.categories, NUMBERS);
    const cx = w / 2;
    const cy = h / 2;
    const unit = Math.min(w, h);
    // O canvas não entende var(--font): usa as famílias já resolvidas da página
    const sans = getComputedStyle(document.body).fontFamily;
    const jp = getComputedStyle(document.querySelector('.font-jp') ?? document.body).fontFamily;

    // Estrelas num túnel (x, y no plano, z de longe para perto) e as palavras que voam
    const stars = Array.from({ length: 520 }, () => ({ a: Math.random() * Math.PI * 2, d: Math.random(), z: Math.random() }));
    const flying = [];
    let spawnAcc = 0;
    let wordIndex = 0;

    const start = performance.now() / 1000;
    let exitAt = start + DOMAIN.close + DOMAIN.void;
    let frozen = null;
    let pieces = null;
    let raf = 0;
    let last = start;

    const leave = () => {
      const now = performance.now() / 1000;
      if (now < start + DOMAIN.close * 0.6) return;
      if (!frozen) exitAt = Math.min(exitAt, now);
    };
    const onKey = (e) => { if (e.key === 'Escape') leave(); };
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', leave);

    const project = (a, d, z) => {
      // z perto de 0 = longe (no centro), perto de 1 = passando pela câmera
      const persp = 1 / Math.max(0.04, 1 - z);
      const r = d * unit * 0.09 * persp;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, persp];
    };

    const drawVoid = (t, dt, closing) => {
      // Fundo: azul-escuro quase preto com uma névoa violeta girando
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, unit * 0.9);
      bg.addColorStop(0, '#0a0d24');
      bg.addColorStop(0.5, '#05060f');
      bg.addColorStop(1, '#000000');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.05);
      for (let i = 0; i < 3; i += 1) {
        ctx.rotate(Math.PI * 0.66);
        const neb = ctx.createRadialGradient(unit * 0.25, 0, 0, unit * 0.25, 0, unit * 0.5);
        neb.addColorStop(0, i === 1 ? 'rgba(90, 60, 200, 0.16)' : 'rgba(40, 110, 220, 0.12)');
        neb.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = neb;
        ctx.beginPath();
        ctx.ellipse(unit * 0.25, 0, unit * 0.55, unit * 0.22, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Túnel de estrelas: correm para fora deixando riscos
      const speed = reduced ? 0 : 0.18 + (closing ? 0 : 0.12);
      ctx.lineCap = 'round';
      stars.forEach((s) => {
        const z0 = s.z;
        s.z += speed * dt * (0.4 + s.d);
        s.a += dt * 0.08;
        if (s.z > 0.98) { s.z = 0; s.d = Math.random(); s.a = Math.random() * Math.PI * 2; }
        const [x0, y0] = project(s.a, s.d + 0.15, z0);
        const [x1, y1, p] = project(s.a, s.d + 0.15, s.z);
        ctx.strokeStyle = `rgba(${200 + s.d * 55}, ${220 + s.d * 35}, 255, ${Math.min(1, 0.25 + s.z)})`;
        ctx.lineWidth = Math.min(2.6, 0.4 + p * 0.25);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      });

      // O anel do centro: buraco escuro com borda de luz branco-azulada pulsando
      const ringR = unit * (0.11 + 0.008 * Math.sin(t * 3));
      const halo = ctx.createRadialGradient(cx, cy, ringR * 0.8, cx, cy, ringR * 2.6);
      halo.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      halo.addColorStop(0.12, 'rgba(160, 210, 255, 0.7)');
      halo.addColorStop(0.45, 'rgba(90, 80, 255, 0.18)');
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, ringR * 0.92, 0, Math.PI * 2);
      ctx.fill();

      // Informação infinita: as palavras saem do anel e voam para quem olha
      if (!closing) {
        spawnAcc += dt * (reduced ? 4 : 14);
        while (spawnAcc > 1) {
          spawnAcc -= 1;
          flying.push({ text: words[wordIndex % words.length], a: Math.random() * Math.PI * 2, d: 0.6 + Math.random() * 1.4, z: 0, spin: (Math.random() - 0.5) * 0.6 });
          wordIndex += 1 + Math.floor(Math.random() * 3);
        }
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = flying.length - 1; i >= 0; i -= 1) {
        const f = flying[i];
        f.z += dt * (reduced ? 0.08 : 0.22);
        if (f.z > 0.97) { flying.splice(i, 1); continue; }
        const [x, y, p] = project(f.a, f.d, f.z);
        const alpha = Math.min(1, f.z * 4) * (1 - Math.max(0, (f.z - 0.75) / 0.22));
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(f.spin * f.z);
        ctx.font = `600 ${Math.min(120, 8 + p * 7)}px ${sans}`;
        ctx.fillStyle = `rgba(225, 238, 255, ${alpha})`;
        ctx.shadowColor = 'rgba(120, 180, 255, 0.8)';
        ctx.shadowBlur = 12;
        ctx.fillText(f.text, 0, 0);
        ctx.restore();
      }

      // O nome do domínio
      const title = Math.min(1, Math.max(0, (t - start - DOMAIN.close - 0.2) / 0.6));
      if (title > 0) {
        ctx.save();
        ctx.globalAlpha = title;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(140, 190, 255, 0.9)';
        ctx.shadowBlur = 24;
        ctx.font = `700 ${Math.round(unit * 0.07)}px ${jp}`;
        ctx.fillText('無量空処', cx, h * 0.84);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = title * 0.75;
        ctx.font = `600 ${Math.round(unit * 0.018)}px ${sans}`;
        ctx.fillText(lang === 'en' ? 'DOMAIN EXPANSION · UNLIMITED VOID' : 'EXPANSÃO DE DOMÍNIO · VAZIO INFINITO', cx, h * 0.84 + unit * 0.06);
        ctx.restore();
      }
    };

    const tick = () => {
      const t = performance.now() / 1000;
      const dt = Math.min(1 / 30, t - last);
      last = t;
      const age = t - start;

      if (t < exitAt) {
        ctx.clearRect(0, 0, w, h);
        // Fechando: o vazio abre num círculo a partir do gatilho, com 領域展開 escrito por cima
        const closing = age < DOMAIN.close;
        ctx.save();
        if (closing) {
          const k = age / DOMAIN.close;
          const reach = Math.hypot(Math.max(open.x, w - open.x), Math.max(open.y, h - open.y));
          ctx.beginPath();
          ctx.arc(open.x, open.y, reach * (1 - (1 - k) ** 3), 0, Math.PI * 2);
          ctx.clip();
        }
        drawVoid(t, dt, closing);
        ctx.restore();
        if (age < DOMAIN.close + 0.5) {
          const a = Math.min(1, age / 0.25) * (1 - Math.max(0, (age - DOMAIN.close) / 0.5));
          ctx.save();
          ctx.globalAlpha = a;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 30;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `800 ${Math.round(unit * 0.12)}px ${jp}`;
          ctx.fillText('領域展開', cx, cy);
          ctx.restore();
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      // Saída: congela o último quadro e quebra em cacos que racham, giram e caem
      if (!frozen) {
        frozen = document.createElement('canvas');
        frozen.width = canvas.width;
        frozen.height = canvas.height;
        frozen.getContext('2d').drawImage(canvas, 0, 0);
        pieces = shards(open.x, open.y, w, h).map((s) => {
          const dx = s.center[0] - open.x;
          const dy = s.center[1] - open.y;
          const dist = Math.hypot(dx, dy) || 1;
          return {
            ...s,
            vx: (dx / dist) * (60 + Math.random() * 160),
            vy: (dy / dist) * (40 + Math.random() * 120) - 80 * Math.random(),
            spin: (Math.random() - 0.5) * 2.4,
            delay: (dist / unit) * 0.12 + Math.random() * 0.08,
          };
        });
      }
      const s = t - exitAt;
      ctx.clearRect(0, 0, w, h);
      if (reduced) {
        ctx.globalAlpha = Math.max(0, 1 - s / 0.5);
        ctx.drawImage(frozen, 0, 0, w, h);
        ctx.globalAlpha = 1;
      } else {
        pieces.forEach((p) => {
          // 0.18 s parado com as rachaduras acesas, depois cai
          const ft = Math.max(0, s - 0.18 - p.delay);
          const ox = p.vx * ft;
          const oy = p.vy * ft + 900 * ft * ft;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - ft / (DOMAIN.shatter - 0.3));
          ctx.translate(p.center[0] + ox, p.center[1] + oy);
          ctx.rotate(p.spin * ft);
          ctx.translate(-p.center[0], -p.center[1]);
          ctx.beginPath();
          p.poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          ctx.save();
          ctx.clip();
          ctx.drawImage(frozen, 0, 0, w, h);
          ctx.restore();
          ctx.strokeStyle = `rgba(220, 240, 255, ${0.9 * Math.max(0, 1 - ft * 3)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        });
      }
      if (s < DOMAIN.shatter) raf = requestAnimationFrame(tick);
      else setOpen(null);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', leave);
    };
  }, [open]);

  if (!open) return null;
  return (
    <canvas
      ref={canvasRef}
      data-domain=""
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 10000, cursor: 'none' }}
    />
  );
}
