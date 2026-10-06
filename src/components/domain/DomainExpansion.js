'use client';
import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { resumeData } from '../../data/resume';
import { journeyStore } from '../../store/journey';
import { DOMAIN, domainWords, voronoiShards } from '../../lib/domain';
import { createVoid } from './voidShader';

// 領域展開 · 無量空処: o Vazio Infinito (carregado só quando alguém abre; ver EasterEggs).
//  1. 領域展開 cai sobre a página escurecida, ideograma por ideograma
//  2. o vazio abre num círculo a partir do gatilho, com um clarão; o orbe negro cresce no centro
//  3. o túnel de estrelas acelera e as ferramentas e números do portfólio voam na direção de quem
//     olha (a "informação infinita"), com o nome do domínio e um contador que não para de subir
//  4. saída (tempo, Esc ou clique): o quadro congela, racha em cacos de Voronoi que acendem nas
//     bordas, giram e caem revelando a página
// Enquanto o vazio cobre a tela, a cena 3D para de desenhar (journeyStore.covered)

const NUMBERS = ['42+', '2.000+', '-70%', '-83%', '40+', '2FA', '24/7', '100%', '∞'];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export default function DomainExpansion({ origin, onDone }) {
  const rootRef = useRef(null);
  const glRef = useRef(null);
  const wordsRef = useRef(null);
  const shardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const glCanvas = glRef.current;
    const wordsCanvas = wordsRef.current;
    const shardCanvas = shardRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lang = document.documentElement.getAttribute('data-language') === 'en' ? 'en' : 'pt';
    const words = domainWords(resumeData[lang].techSection.categories, NUMBERS);
    const sans = getComputedStyle(document.body).fontFamily;
    const unit = Math.min(w, h);

    // O shader roda numa resolução menor que a tela (é um vazio difuso: não precisa de nitidez)
    const glScale = Math.min(1, 1.15 / dpr) * dpr;
    glCanvas.width = Math.round(w * glScale);
    glCanvas.height = Math.round(h * glScale);
    for (const c of [wordsCanvas, shardCanvas]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const wctx = wordsCanvas.getContext('2d');
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sctx = shardCanvas.getContext('2d');
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const voidGl = createVoid(glCanvas);
    const glOrigin = [origin.x * glScale, (h - origin.y) * glScale];

    // Tipografia: entrada do 領域展開, depois o nome do domínio, a legenda e o contador
    const q = (s) => root.querySelectorAll(s);
    const tl = gsap.timeline();
    tl.to(q('.dx-dim'), { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0)
      .fromTo(q('.dx-intro-char'), { opacity: 0, scale: 1.9, filter: 'blur(14px)', yPercent: -8 }, {
        opacity: 1, scale: 1, filter: 'blur(0px)', yPercent: 0, duration: 0.42, stagger: 0.07, ease: 'expo.out',
      }, 0.05)
      .fromTo(q('.dx-intro-sub'), { opacity: 0, letterSpacing: '1.2em' }, { opacity: 0.8, letterSpacing: '0.6em', duration: 0.6, ease: 'expo.out' }, 0.3)
      .to(q('.dx-intro'), { opacity: 0, scale: 1.12, filter: 'blur(10px)', duration: 0.45, ease: 'power2.in' }, DOMAIN.close + 0.05)
      .fromTo(q('.dx-name-char'), { opacity: 0, yPercent: 60, filter: 'blur(8px)' }, {
        opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.09, ease: 'expo.out',
      }, DOMAIN.close + 0.55)
      .fromTo(q('.dx-line'), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.inOut' }, DOMAIN.close + 0.7)
      .fromTo(q('.dx-label'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, DOMAIN.close + 0.85);
    const counter = root.querySelector('.dx-count');

    // Palavras voando: profundidade z (0 longe .. 1 passando), ângulo e distância do centro
    const flying = [];
    let spawnAcc = 0;
    let wordIndex = 0;
    const project = (a, d, z) => {
      const persp = 1 / Math.max(0.05, 1 - z);
      const r = d * unit * 0.11 * persp;
      return [w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, persp];
    };
    const drawWords = (dt, active) => {
      wctx.clearRect(0, 0, w, h);
      if (active && !reduced) {
        spawnAcc += dt * 16;
        while (spawnAcc > 1) {
          spawnAcc -= 1;
          const text = words[wordIndex % words.length];
          flying.push({ text, a: Math.random() * Math.PI * 2, d: 0.9 + Math.random() * 1.6, z: 0, mono: /[0-9%∞+]/.test(text), hue: Math.random() });
          wordIndex += 1 + Math.floor(Math.random() * 4);
        }
      }
      wctx.globalCompositeOperation = 'lighter';
      wctx.textAlign = 'center';
      wctx.textBaseline = 'middle';
      for (let i = flying.length - 1; i >= 0; i -= 1) {
        const f = flying[i];
        f.z += dt * 0.24;
        if (f.z > 0.96) { flying.splice(i, 1); continue; }
        const [x, y, p] = project(f.a, f.d, f.z);
        const alpha = Math.min(1, f.z * 5) * (1 - Math.max(0, (f.z - 0.7) / 0.26));
        const size = Math.min(140, 7 + p * 6.5);
        const color = f.hue < 0.6 ? '225, 238, 255' : f.hue < 0.85 ? '150, 220, 255' : '215, 175, 255';
        wctx.font = `${f.mono ? 500 : 600} ${size}px ${f.mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : sans}`;
        // Brilho: as palavras de perto ganham halo; as de longe ficam pequenas e nítidas
        wctx.shadowColor = `rgba(${color}, ${alpha * 0.7})`;
        wctx.shadowBlur = Math.min(18, p * 2.5);
        wctx.fillStyle = `rgba(${color}, ${alpha * 0.9})`;
        wctx.fillText(f.text, x, y);
      }
      wctx.globalCompositeOperation = 'source-over';
      wctx.shadowBlur = 0;
    };

    // Estado da animação
    const start = performance.now() / 1000;
    let exitAt = start + DOMAIN.close + DOMAIN.void;
    let frozen = null;
    let shards = null;
    let raf = 0;
    let last = start;
    let covered = false;
    let count = 0;
    // Percurso do túnel: acumulado quadro a quadro (velocidade × tempo daria saltos)
    let travel = 0;

    const leave = () => {
      const now = performance.now() / 1000;
      if (now > start + DOMAIN.close && !frozen) exitAt = Math.min(exitAt, now);
    };
    const onKey = (e) => { if (e.key === 'Escape') leave(); };
    window.addEventListener('keydown', onKey);
    root.addEventListener('pointerdown', leave);

    const tick = () => {
      const t = performance.now() / 1000;
      const dt = Math.min(1 / 30, t - last);
      last = t;
      const age = t - start;

      if (t < exitAt) {
        // Abertura (0.35 s depois do 領域展開), clarão no fim dela e o orbe crescendo
        const rk = reduced ? 1 : Math.min(1, Math.max(0, (age - 0.35) / (DOMAIN.close - 0.35)));
        const reveal = ease(rk);
        const flash = Math.max(0, 1 - Math.abs(age - DOMAIN.close) / 0.25) * 0.35;
        const ok = Math.min(1, Math.max(0, (age - DOMAIN.close + 0.2) / 0.9));
        const orb = reduced ? 1 : 1 - (1 - ok) ** 3 * Math.cos(ok * 4);
        const warp = reduced ? 0 : 0.4 + 2.6 * Math.exp(-((age - DOMAIN.close - 0.9) ** 2) / 0.6);
        travel += dt * (0.15 + warp * 0.45);
        voidGl?.draw({ time: age, reveal, origin: glOrigin, orb: Math.max(0, orb), warp, flash, travel });
        if (!covered && reveal >= 1) {
          covered = true;
          journeyStore.getState().setCovered(true);
        }
        drawWords(dt, age > DOMAIN.close + 0.4);
        // Contador da informação infinita: cresce cada vez mais rápido
        if (age > DOMAIN.close + 0.85) {
          count += dt * (2000 + count * 2.2);
          counter.textContent = Math.floor(count).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR');
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      // Saída: congela o vazio + palavras e quebra em cacos
      if (!frozen) {
        frozen = document.createElement('canvas');
        frozen.width = wordsCanvas.width;
        frozen.height = wordsCanvas.height;
        const fctx = frozen.getContext('2d');
        fctx.drawImage(glCanvas, 0, 0, frozen.width, frozen.height);
        fctx.drawImage(wordsCanvas, 0, 0);
        glCanvas.style.visibility = 'hidden';
        wordsCanvas.style.visibility = 'hidden';
        gsap.to(q('.dx-type, .dx-dim'), { opacity: 0, duration: 0.18 });
        journeyStore.getState().setCovered(false);
        shards = voronoiShards(origin.x, origin.y, w, h).map((s) => {
          const dx = s.center[0] - origin.x;
          const dy = s.center[1] - origin.y;
          const len = Math.hypot(dx, dy) || 1;
          return {
            ...s,
            vx: (dx / len) * (80 + Math.random() * 220),
            vy: (dy / len) * (60 + Math.random() * 160) - 120 * Math.random(),
            spin: (Math.random() - 0.5) * 3,
            tilt: Math.random() * Math.PI * 2,
            delay: s.dist * 0.35 + Math.random() * 0.06,
          };
        });
      }
      const s = t - exitAt;
      sctx.clearRect(0, 0, w, h);
      if (reduced) {
        sctx.globalAlpha = Math.max(0, 1 - s / 0.5);
        sctx.drawImage(frozen, 0, 0, w, h);
        sctx.globalAlpha = 1;
      } else {
        const crack = Math.min(1, s / 0.12);
        shards.forEach((p) => {
          const ft = Math.max(0, s - 0.22 - p.delay);
          const ox = p.vx * ft;
          const oy = p.vy * ft + 1100 * ft * ft;
          const rot = p.spin * ft;
          // Inclinação 3D falsa: o caco encolhe num eixo enquanto gira e escurece/clareia
          const tilt = Math.cos(p.tilt + ft * 5);
          const sx = 1 + ft * 0.25;
          const sy = (1 + ft * 0.25) * (0.75 + 0.25 * tilt);
          const alpha = Math.max(0, 1 - ft / 1.1);
          if (alpha <= 0) return;
          sctx.save();
          sctx.globalAlpha = alpha;
          sctx.translate(p.center[0] + ox, p.center[1] + oy);
          sctx.rotate(rot);
          sctx.scale(sx, sy);
          sctx.translate(-p.center[0], -p.center[1]);
          sctx.beginPath();
          p.poly.forEach(([x, y], i) => (i ? sctx.lineTo(x, y) : sctx.moveTo(x, y)));
          sctx.closePath();
          sctx.save();
          sctx.clip();
          sctx.drawImage(frozen, 0, 0, w, h);
          // Luz no vidro: um véu claro ou escuro conforme a inclinação
          sctx.fillStyle = tilt > 0 ? `rgba(220, 235, 255, ${0.12 * tilt * Math.min(1, ft * 4)})` : `rgba(0, 0, 10, ${-0.3 * tilt * Math.min(1, ft * 4)})`;
          sctx.fillRect(p.center[0] - w, p.center[1] - h, w * 2, h * 2);
          sctx.restore();
          // Rachaduras acesas, depois a quina do vidro brilhando
          sctx.lineWidth = ft > 0 ? 1.2 : 1.6;
          sctx.strokeStyle = `rgba(235, 245, 255, ${ft > 0 ? 0.55 * alpha : 0.9 * crack})`;
          sctx.shadowColor = 'rgba(160, 210, 255, 0.9)';
          sctx.shadowBlur = ft > 0 ? 0 : 10;
          sctx.stroke();
          sctx.restore();
        });
        // Clarão no instante da quebra
        if (s < 0.3) {
          sctx.fillStyle = `rgba(230, 240, 255, ${0.35 * (1 - s / 0.3) * crack})`;
          sctx.fillRect(0, 0, w, h);
        }
      }
      if (s < DOMAIN.shatter + 0.4) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      tl.kill();
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('pointerdown', leave);
      journeyStore.getState().setCovered(false);
      voidGl?.dispose();
    };
  }, [origin, onDone]);

  const en = typeof document !== 'undefined' && document.documentElement.getAttribute('data-language') === 'en';
  return (
    <div ref={rootRef} className="dx" data-domain="" aria-hidden="true">
      <div className="dx-dim" />
      <canvas ref={glRef} className="dx-layer" />
      <canvas ref={wordsRef} className="dx-layer" />
      <canvas ref={shardRef} className="dx-layer" />
      <div className="dx-type">
        <div className="dx-intro">
          <p className="dx-intro-jp font-jp" lang="ja">
            {[...'領域展開'].map((c) => <span key={c} className="dx-intro-char">{c}</span>)}
          </p>
          <p className="dx-intro-sub">RYŌIKI TENKAI</p>
        </div>
        <div className="dx-name">
          <p className="dx-name-jp font-jp" lang="ja">
            {[...'無量空処'].map((c) => <span key={c} className="dx-name-char">{c}</span>)}
          </p>
          <span className="dx-line" />
          <p className="dx-label">MURYŌKŪSHO</p>
          <p className="dx-label dx-label-dim">{en ? 'Domain Expansion · Unlimited Void' : 'Expansão de Domínio · Vazio Infinito'}</p>
        </div>
        <div className="dx-meta">
          <p className="dx-label dx-label-dim font-jp" lang="ja">情報</p>
          <p className="dx-count">0</p>
          <p className="dx-label dx-label-dim">{en ? 'information, endlessly' : 'informação, sem fim'}</p>
        </div>
        <p className="dx-hint dx-label dx-label-dim">ESC</p>
      </div>
    </div>
  );
}
