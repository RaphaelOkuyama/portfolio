'use client';
import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { resumeData } from '../../data/resume';
import { journeyStore } from '../../store/journey';
import { DOMAIN, pickTargets, rectPoly, resample, voronoiCells } from '../../lib/domain';
import { createVoid } from './voidShader';
import { buildSprites } from './sprites';

// 領域展開 · 無量空処: o Vazio Infinito (carregado só quando alguém abre; ver EasterEggs).
//  1. 領域展開 cai sobre a página escurecida, ideograma por ideograma
//  2. o vazio abre num círculo a partir do gatilho, com um clarão; o orbe negro cresce no centro
//  3. peças do próprio portfólio (tiras do Tanabata, cartões de projeto, números) saem do orbe e
//     voam na direção de quem olha; o contador da informação não para de subir
//  4. saturação: a informação acelera, o túnel dispara, a tela treme e estoura para o branco
//  5. reconstrução: o branco racha e cada caco, que é a região de um elemento real da página, voa e
//     se molda até a forma dele; ao encaixar, o elemento se materializa. O domínio se desfaz e
//     reconstrói o portfólio
// Enquanto o vazio cobre a tela, a cena 3D para de desenhar (journeyStore.covered)

const METRICS = {
  pt: [['42+', 'clínicas'], ['2.000+', 'laudos/mês'], ['-70%', 'tempo de contratos'], ['-83%', 'chamados'], ['40+', 'PDVs'], ['2FA', 'segurança']],
  en: [['42+', 'clinics'], ['2,000+', 'reports/month'], ['-70%', 'contract time'], ['-83%', 'tickets'], ['40+', 'POS'], ['2FA', 'security']],
};
// O que pode ser reconstruído: folhas visíveis da página (o resto é filtrado em pickTargets)
const TARGETS = 'header a, header button, main h1, main h2, main h3, main p, main a, main button, main img, main li, main figure';
// Saturação: quanto dura antes da quebra (no fim natural e quando a pessoa sai antes)
const SATURATE = { natural: 1.4, early: 0.6 };
const POINTS = 28;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default function DomainExpansion({ origin, onDone }) {
  const rootRef = useRef(null);
  const glRef = useRef(null);
  const itemsRef = useRef(null);
  const shardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const glCanvas = glRef.current;
    const itemsCanvas = itemsRef.current;
    const shardCanvas = shardRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lang = document.documentElement.getAttribute('data-language') === 'en' ? 'en' : 'pt';
    const fonts = {
      sans: getComputedStyle(document.body).fontFamily,
      serif: getComputedStyle(document.querySelector('h1, h2') ?? document.body).fontFamily,
      jp: getComputedStyle(document.querySelector('.font-jp') ?? document.body).fontFamily,
    };
    const sprites = buildSprites(resumeData[lang], METRICS[lang], fonts);
    const unit = Math.min(w, h);

    // O shader roda numa resolução menor que a tela (é um vazio difuso: não precisa de nitidez)
    const glScale = Math.min(1, 1.15 / dpr) * dpr;
    glCanvas.width = Math.round(w * glScale);
    glCanvas.height = Math.round(h * glScale);
    for (const c of [itemsCanvas, shardCanvas]) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ictx = itemsCanvas.getContext('2d');
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    const layers = [glCanvas, itemsCanvas];

    // Peças voando: nascem dentro do orbe (z = 0, perto do centro) e só aparecem ao passar da borda
    // dele; com a perspectiva crescem e passam pela câmera
    const flying = [];
    let spawnAcc = 0;
    let spriteIndex = 0;
    const project = (a, d, z) => {
      const persp = 1 / Math.max(0.05, 1 - z);
      const r = d * unit * 0.11 * persp;
      return [w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, persp];
    };
    const drawItems = (dt, active, sat, orbR) => {
      ictx.clearRect(0, 0, w, h);
      if (active && !reduced) {
        spawnAcc += dt * (9 + 48 * sat);
        while (spawnAcc > 1) {
          spawnAcc -= 1;
          flying.push({
            s: sprites[spriteIndex % sprites.length],
            a: Math.random() * Math.PI * 2,
            d: 0.35 + Math.random() * 1.1,
            z: 0,
            rot: (Math.random() - 0.5) * 0.5,
            spin: (Math.random() - 0.5) * 2.4,
            flip: Math.random() * Math.PI * 2,
          });
          spriteIndex += 1;
        }
      }
      for (let i = flying.length - 1; i >= 0; i -= 1) {
        const f = flying[i];
        f.z += dt * (0.2 + 0.4 * sat);
        if (f.z > 0.95) { flying.splice(i, 1); continue; }
        const [x, y, p] = project(f.a, f.d, f.z);
        const dist = Math.hypot(x - w / 2, y - h / 2);
        // Saindo do orbe: invisível dentro dele, aparece ao cruzar a borda
        const emerge = clamp01((dist - orbR * 0.92) / (orbR * 0.3));
        const alpha = emerge * (1 - clamp01((f.z - 0.72) / 0.23));
        if (alpha <= 0.01) continue;
        const scale = p * 0.34;
        // Giro 3D falso: a peça vira em torno do próprio eixo (encolhe na largura)
        const flipX = 0.35 + 0.65 * Math.abs(Math.cos(f.flip + f.z * f.spin * 3));
        ictx.save();
        ictx.globalAlpha = alpha;
        ictx.translate(x, y);
        ictx.rotate(f.rot + f.spin * f.z * 0.6);
        ictx.scale(scale * flipX, scale);
        ictx.shadowColor = 'rgba(120, 180, 255, 0.55)';
        ictx.shadowBlur = 18;
        ictx.drawImage(f.s.c, -f.s.w / 2, -f.s.h / 2, f.s.w, f.s.h);
        ictx.restore();
      }
    };

    // Estado da animação
    const start = performance.now() / 1000;
    let exitAt = start + DOMAIN.close + DOMAIN.void;
    let satStart = exitAt - SATURATE.natural;
    let raf = 0;
    let last = start;
    let covered = false;
    let count = 0;
    let travel = 0;
    let rebuild = null;
    let targets = null;

    // Elementos que vão ser reconstruídos: escolhidos no começo da saturação e escondidos (o vazio
    // ainda cobre tudo, ninguém vê); cada um reaparece quando o caco dele encaixa
    const collectTargets = () => {
      if (targets) return;
      const items = [...document.querySelectorAll(TARGETS)]
        .filter((el) => !el.closest('.dx'))
        .map((el) => ({ el, rect: el.getBoundingClientRect() }));
      targets = pickTargets(items, w, h);
      targets.forEach((t) => t.el.classList.add('dx-hidden'));
    };
    const reveal = (el) => {
      el.classList.remove('dx-hidden');
      el.animate?.([
        { opacity: 0, filter: 'blur(10px) brightness(2.2)' },
        { opacity: 1, filter: 'blur(0px) brightness(1)' },
      ], { duration: 520, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
    };

    const leave = () => {
      const now = performance.now() / 1000;
      if (now < start + DOMAIN.close || rebuild || now >= satStart) return;
      satStart = now;
      exitAt = now + SATURATE.early;
    };
    const onKey = (e) => { if (e.key === 'Escape') leave(); };
    window.addEventListener('keydown', onKey);
    root.addEventListener('pointerdown', leave);

    // Saída: congela o branco, monta os cacos a partir dos elementos e começa a reconstrução
    const startRebuild = () => {
      const frozen = document.createElement('canvas');
      frozen.width = itemsCanvas.width;
      frozen.height = itemsCanvas.height;
      const fctx = frozen.getContext('2d');
      fctx.drawImage(glCanvas, 0, 0, frozen.width, frozen.height);
      fctx.drawImage(itemsCanvas, 0, 0);
      layers.forEach((c) => { c.style.visibility = 'hidden'; });
      gsap.to(q('.dx-type, .dx-dim'), { opacity: 0, duration: 0.15 });
      journeyStore.getState().setCovered(false);
      collectTargets();
      const diag = Math.hypot(w, h);
      // Um ponto por elemento (no centro dele) e alguns de enchimento para cobrir o resto da tela
      const sites = targets.map((t) => [
        Math.min(w - 1, Math.max(1, t.rect.left + t.rect.width / 2)),
        Math.min(h - 1, Math.max(1, t.rect.top + t.rect.height / 2)),
      ]);
      const fillers = Array.from({ length: 14 }, () => [Math.random() * w, Math.random() * h]);
      const cells = voronoiCells([...sites, ...fillers], w, h).map((c) => {
        const target = c.index < targets.length ? targets[c.index] : null;
        const dist = Math.hypot(c.center[0] - origin.x, c.center[1] - origin.y) / diag;
        return {
          ...c,
          target,
          from: resample(c.poly, POINTS),
          to: target ? resample(rectPoly(target.rect), POINTS) : null,
          delay: dist * 0.45 + Math.random() * 0.06,
          dur: 0.62 + Math.random() * 0.2,
          vx: (c.center[0] - origin.x) * (0.4 + Math.random() * 0.4),
          vy: (c.center[1] - origin.y) * (0.4 + Math.random() * 0.4),
          landed: 0,
        };
      });
      rebuild = { frozen, cells, at: performance.now() / 1000 };
    };

    const drawRebuild = (now) => {
      const s = now - rebuild.at;
      sctx.clearRect(0, 0, w, h);
      let busy = false;
      // Rachaduras acesas sobre o branco nos primeiros instantes
      const crack = clamp01(s / 0.1) * (1 - clamp01((s - 0.12) / 0.2));
      rebuild.cells.forEach((c) => {
        const k = ease(clamp01((s - 0.14 - c.delay) / c.dur));
        let pts;
        let alpha;
        if (c.to) {
          pts = c.from.map((p, i) => [p[0] + (c.to[i][0] - p[0]) * k, p[1] + (c.to[i][1] - p[1]) * k]);
          // No meio do voo o caco cresce um pouco (vem na direção da câmera) e volta ao tamanho
          const bulge = 1 + 0.14 * Math.sin(Math.PI * k);
          const cx = pts.reduce((m, p) => m + p[0], 0) / pts.length;
          const cy = pts.reduce((m, p) => m + p[1], 0) / pts.length;
          pts = pts.map(([x, y]) => [cx + (x - cx) * bulge, cy + (y - cy) * bulge]);
          alpha = 1 - k * 0.85;
          if (k >= 1 && !c.landed) {
            c.landed = now;
            reveal(c.target.el);
          }
          if (!c.landed || now - c.landed < 0.4) busy = true;
        } else {
          // Enchimento: se desfaz em pó, afastando-se do impacto
          const ft = Math.max(0, s - 0.14 - c.delay);
          pts = c.from.map(([x, y]) => [x + c.vx * ft * 0.5, y + c.vy * ft * 0.5 + 300 * ft * ft]);
          alpha = 1 - clamp01(ft / 0.55);
          if (alpha > 0) busy = true;
        }
        if (alpha > 0.01 && !(c.landed && now - c.landed > 0.4)) {
          sctx.save();
          sctx.beginPath();
          pts.forEach(([x, y], i) => (i ? sctx.lineTo(x, y) : sctx.moveTo(x, y)));
          sctx.closePath();
          sctx.save();
          sctx.clip();
          sctx.globalAlpha = Math.max(0, alpha);
          sctx.drawImage(rebuild.frozen, 0, 0, w, h);
          // Luz no caco enquanto voa
          sctx.fillStyle = `rgba(215, 235, 255, ${0.3 * alpha})`;
          sctx.fillRect(0, 0, w, h);
          sctx.restore();
          sctx.strokeStyle = `rgba(240, 248, 255, ${Math.max(crack, 0.75 * alpha)})`;
          sctx.lineWidth = 1.2;
          sctx.shadowColor = 'rgba(150, 205, 255, 0.9)';
          sctx.shadowBlur = 8;
          sctx.stroke();
          sctx.restore();
        }
        // Encaixou: o contorno do elemento acende e apaga
        if (c.landed && now - c.landed < 0.4) {
          const r = c.target.rect;
          const glow = 1 - (now - c.landed) / 0.4;
          sctx.save();
          sctx.strokeStyle = `rgba(200, 230, 255, ${0.8 * glow})`;
          sctx.lineWidth = 1.5;
          sctx.shadowColor = 'rgba(140, 200, 255, 0.9)';
          sctx.shadowBlur = 14;
          sctx.strokeRect(r.left, r.top, r.width, r.height);
          sctx.restore();
        }
      });
      // O branco da saturação ainda some por cima no começo
      if (s < 0.35) {
        sctx.fillStyle = `rgba(240, 246, 255, ${0.85 * (1 - s / 0.35)})`;
        sctx.fillRect(0, 0, w, h);
      }
      return busy || s < 0.5;
    };

    const tick = () => {
      const t = performance.now() / 1000;
      const dt = Math.min(1 / 30, t - last);
      last = t;
      const age = t - start;

      if (!rebuild && t < exitAt) {
        const sat = reduced ? 0 : clamp01((t - satStart) / (exitAt - satStart));
        if (sat > 0) collectTargets();
        // Abertura (0.35 s depois do 領域展開), clarão no fim dela e o orbe crescendo
        const rk = reduced ? 1 : clamp01((age - 0.35) / (DOMAIN.close - 0.35));
        const opening = ease(rk);
        const flash = Math.max(0, 1 - Math.abs(age - DOMAIN.close) / 0.25) * 0.35 + sat ** 2.2 * 1.4;
        const ok = clamp01((age - DOMAIN.close + 0.2) / 0.9);
        const orb = reduced ? 1 : Math.max(0, 1 - (1 - ok) ** 3 * Math.cos(ok * 4));
        const warp = reduced ? 0 : 0.4 + 2.6 * Math.exp(-((age - DOMAIN.close - 0.9) ** 2) / 0.6) + sat * 5;
        travel += dt * (0.15 + warp * 0.45);
        voidGl?.draw({ time: age, reveal: opening, origin: glOrigin, orb, warp, flash, travel });
        if (!covered && opening >= 1) {
          covered = true;
          journeyStore.getState().setCovered(true);
        }
        drawItems(dt, age > DOMAIN.close + 0.3, sat, 0.165 * orb * h);
        // Tremor da saturação: a tela inteira não aguenta tanta informação
        const shake = sat * sat * 7;
        const tx = (Math.random() - 0.5) * shake;
        const ty = (Math.random() - 0.5) * shake;
        layers.forEach((c) => { c.style.transform = shake ? `translate(${tx}px, ${ty}px)` : ''; });
        // Contador da informação infinita: cresce cada vez mais rápido (e dispara na saturação)
        if (age > DOMAIN.close + 0.85) {
          count += dt * (2000 + count * (2.2 + sat * 9));
          counter.textContent = Math.floor(count).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR');
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      if (!rebuild) {
        if (reduced) {
          targets?.forEach((x) => x.el.classList.remove('dx-hidden'));
          onDone();
          return;
        }
        startRebuild();
      }
      if (drawRebuild(t)) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      tl.kill();
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('pointerdown', leave);
      journeyStore.getState().setCovered(false);
      // Nada fica escondido se o domínio sair no meio
      targets?.forEach((x) => x.el.classList.remove('dx-hidden'));
      voidGl?.dispose();
    };
  }, [origin, onDone]);

  const en = typeof document !== 'undefined' && document.documentElement.getAttribute('data-language') === 'en';
  return (
    <div ref={rootRef} className="dx" data-domain="" aria-hidden="true">
      <div className="dx-dim" />
      <canvas ref={glRef} className="dx-layer" />
      <canvas ref={itemsRef} className="dx-layer" />
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
