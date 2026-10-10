'use client';
import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { resumeData } from '../../data/resume';
import { journeyStore } from '../../store/journey';
import { DOMAIN, pickTargets, rectPoly, resample, voronoiCells } from '../../lib/domain';
import { takeVoid } from './voidShader';
import { buildSpritesGradually } from './sprites';
import { createDomainSound, savedVolume } from './sound';
import HandSeal from './HandSeal';

// 領域展開 · 無量空処: o Vazio Infinito (carregado só quando alguém abre; ver EasterEggs).
//  1. Ativação (0–0,8 s): a página escurece, o selo de mão do Gojo (indicador e médio cruzados)
//     acende e 領域展開 surge em pinceladas; o som grave marca a abertura
//  2. Expansão (0,8–2,0 s): o vazio rasga a cena a partir do gatilho, com a página real sendo puxada
//     para ele (lente); o buraco negro nasce no centro, com o disco em espiral e o anel azul-gelo
//  3. Informação infinita (2,0–5,3 s): primeiro, legível, a história (os projetos com a stack, os
//     números reais); depois a enxurrada (as tiras do Stack, 奥山, as quatro estações), que se
//     multiplica, se sobrepõe e vira partícula. O contador acompanha até perder o sentido
//     No pico, tudo congela por meio segundo (o cursor trava, o som some): quem
//     está no domínio não consegue agir
//  4. Saturação (5,3–6,0 s): a informação dispara, a tela treme e estoura para o branco
//  5. Reconstrução (6,0–7,6 s): o branco racha; cada caco é a região de um elemento real visível e
//     carrega o conteúdo dele (os glifos do texto se juntam na fonte do site, a imagem em pedaços,
//     botões e cartões contornados pela borda). Ao encaixar, o elemento volta; quando tudo encaixa,
//     um pulso de luz percorre a interface e o hanko 奥山 assina
// Enquanto o vazio cobre a tela, a cena 3D para de desenhar (journeyStore.covered)

const METRICS = {
  pt: [['42+', 'clínicas'], ['2.000+', 'laudos/mês'], ['-70%', 'tempo de contratos'], ['-83%', 'chamados'], ['40+', 'PDVs'], ['2FA', 'segurança']],
  en: [['42+', 'clinics'], ['2,000+', 'reports/month'], ['-70%', 'contract time'], ['-83%', 'tickets'], ['40+', 'POS'], ['2FA', 'security']],
};
// O que pode ser reconstruído: folhas visíveis da página (o resto é filtrado em pickTargets)
const TARGETS = 'header a, header button, main h1, main h2, main h3, main p, main a, main button, main img, main li, main figure';
// Saturação: quanto dura antes da quebra (no fim natural e quando a pessoa sai antes; a saída
// antecipada também passa pelo estouro, só mais curto)
const SATURATE = { natural: 0.7, early: 0.5 };
// A informação: começa pela história legível e vira enxurrada a partir desta fração do vazio
const FLOOD_AT = 0.42;
// O congelamento acaba um pouco antes da saturação e dura isto (s)
const FREEZE = { lead: 0.08, length: 0.55 };
const POINTS = 28;
const MAX_GLYPHS = 320;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Um nó de texto aparece de fato? (o pai e os ancestrais até o elemento visíveis: rótulos escondidos,
// como os do trilho lateral fora do hover, ficam de fora)
function shownNode(node, el) {
  const parent = node.parentElement;
  if (!parent || !node.textContent.trim()) return null;
  const cs = getComputedStyle(parent);
  if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.1 || !parent.getClientRects().length) return null;
  for (let a = parent; a && a !== el; a = a.parentElement) {
    if (Number(getComputedStyle(a).opacity) < 0.1) return null;
  }
  return cs;
}

// Cada glifo do texto no lugar exato em que o navegador o desenhou (Range por caractere: quebra de
// linha, kerning, ruby e alinhamento já resolvidos), com a fonte e a cor do seu trecho
function layoutGlyphs(el, origin, w, h) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const glyphs = [];
  for (let node = walker.nextNode(); node && glyphs.length < MAX_GLYPHS; node = walker.nextNode()) {
    const cs = shownNode(node, el);
    if (!cs) continue;
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const upper = cs.textTransform === 'uppercase';
    const text = node.textContent;
    for (let i = 0; i < text.length && glyphs.length < MAX_GLYPHS; i += 1) {
      const raw = text[i];
      if (!raw.trim()) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      if (r.width < 0.5 || r.bottom < 0 || r.top > h || r.right < 0 || r.left > w) continue;
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      // Cada glifo chega de longe, na direção oposta ao impacto, girando
      const dx = x - origin.x;
      const dy = y - origin.y;
      const d = Math.hypot(dx, dy) || 1;
      const throwLen = 60 + Math.random() * 160;
      glyphs.push({
        ch: upper ? raw.toUpperCase() : raw, x, y, font, color: cs.color,
        sx: (dx / d) * throwLen + (Math.random() - 0.5) * 80,
        sy: (dy / d) * throwLen + (Math.random() - 0.5) * 80,
        rot: (Math.random() - 0.5) * 2.4,
        lag: Math.random() * 0.25,
      });
    }
  }
  range.detach?.();
  return glyphs.length ? { glyphs } : null;
}

// O que o caco de cada elemento carrega: a imagem, os glifos e/ou o contorno da caixa
function describe(el, rect, origin, w, h) {
  const img = el.tagName === 'IMG' ? el : el.querySelector?.('img');
  if (img && img.complete && img.naturalWidth > 0) {
    const r = img === el ? rect : img.getBoundingClientRect();
    return { img, imgRect: r };
  }
  const cs = getComputedStyle(el);
  const bg = cs.backgroundColor;
  const border = parseFloat(cs.borderTopWidth) || 0;
  const boxy = el.tagName === 'BUTTON' || border > 0 || (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg));
  return {
    text: layoutGlyphs(el, origin, w, h),
    box: boxy ? { radius: Math.min(parseFloat(cs.borderTopLeftRadius) || 0, rect.height / 2), color: border > 0 ? cs.borderTopColor : cs.color } : null,
  };
}

function roundedPath(ctx, r, radius) {
  const rad = Math.min(radius, r.width / 2, r.height / 2);
  ctx.beginPath();
  ctx.moveTo(r.left + rad, r.top);
  ctx.arcTo(r.right, r.top, r.right, r.bottom, rad);
  ctx.arcTo(r.right, r.bottom, r.left, r.bottom, rad);
  ctx.arcTo(r.left, r.bottom, r.left, r.top, rad);
  ctx.arcTo(r.left, r.top, r.right, r.top, rad);
  ctx.closePath();
}

export default function DomainExpansion({ origin, onDone }) {
  const rootRef = useRef(null);
  const glRef = useRef(null);
  const itemsRef = useRef(null);
  const shardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    // O vazio: o canvas pré-compilado (se a pessoa começou a digitar ou segurar antes) entra no lugar
    // do canvas do componente; senão compila agora
    const { canvas: glCanvas, v: voidGl } = takeVoid(glRef.current);
    if (glCanvas !== glRef.current) {
      glCanvas.className = glRef.current.className;
      glCanvas.setAttribute('aria-hidden', 'true');
      glRef.current.after(glCanvas);
      glRef.current.style.display = 'none';
    }
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
    // As peças só aparecem aos 2 s: são desenhadas aos poucos, algumas por quadro, enquanto o selo
    // e o 領域展開 acontecem (de uma vez, seguravam a página ~100 ms)
    const pieces = { story: [], flood: [] };
    const cancelSprites = buildSpritesGradually(resumeData[lang], METRICS[lang], fonts, lang, pieces);
    const unit = Math.min(w, h);
    // Celular: menos peças, menos partículas e menos tremor
    const small = unit < 700;
    const density = small ? 0.55 : 1;

    // O shader roda numa resolução menor que a tela (é um vazio difuso: não precisa de nitidez)
    const glScale = Math.min(1, (small ? 0.9 : 1.15) / dpr) * dpr;
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
    const glOrigin = [origin.x * glScale, (h - origin.y) * glScale];

    // Tipografia: 領域展開 em pinceladas (cada ideograma é revelado de cima para baixo, como o pincel
    // descendo, com o traço de tinta embaixo); 無量空処 entra com distorção (aberração e inclinação)
    // e se expande até assentar; depois a legenda e o contador
    const q = (s) => root.querySelectorAll(s);
    const close = DOMAIN.close;
    const tl = gsap.timeline();
    tl.to(q('.dx-dim'), { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
      // 印: o selo de mão acende, segura um instante e se desfaz quando o nome do domínio entra
      .fromTo(q('.dx-seal'), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.32, ease: 'power3.out' }, 0)
      .to(q('.dx-seal'), { opacity: 0, scale: 1.08, duration: 0.35, ease: 'power2.in' }, 0.62)
      .fromTo(q('.dx-intro-char'), { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0, y: -14, scale: 1.12 }, {
        clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out',
      }, 0.62)
      .fromTo(q('.dx-brush'), { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.7, ease: 'expo.inOut' }, 0.74)
      .fromTo(q('.dx-intro-sub'), { opacity: 0, letterSpacing: '1.2em' }, { opacity: 0.8, letterSpacing: '0.6em', duration: 0.6, ease: 'expo.out' }, 0.95)
      // Legendas, como no cinema: a fala aparece letra por letra embaixo da tela
      .fromTo(q('.dx-caption-1 .dx-caption-char'), { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.04 }, 0.35)
      .to(q('.dx-caption-1'), { opacity: 0, duration: 0.3 }, close - 0.2)
      .fromTo(q('.dx-caption-2 .dx-caption-char'), { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.045 }, close + 0.1)
      .to(q('.dx-caption-2'), { opacity: 0, duration: 0.4 }, close + 1.9)
      .to(q('.dx-intro'), { opacity: 0, scale: 1.14, duration: 0.4, ease: 'power2.in' }, close - 0.3)
      .fromTo(q('.dx-name-char'), {
        opacity: 0, scale: 0.55, skewX: 22,
        textShadow: '-9px 0px 10px rgba(255,70,120,0.9), 9px 0px 10px rgba(70,200,255,0.9)',
      }, {
        opacity: 1, scale: 1, skewX: 0,
        textShadow: '0px 0px 24px rgba(140,190,255,0.55), 0px 0px 24px rgba(140,190,255,0)',
        duration: 0.95, stagger: 0.08, ease: 'expo.out',
      }, close + 0.15)
      .fromTo(q('.dx-name-jp'), { letterSpacing: '0.4em' }, { letterSpacing: '0.04em', duration: 1.1, ease: 'expo.out' }, close + 0.15)
      .fromTo(q('.dx-line'), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.inOut' }, close + 0.35)
      .fromTo(q('.dx-label, .dx-count'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, close + 0.45);
    const counter = root.querySelector('.dx-count');
    const layers = [glCanvas, itemsCanvas];

    // Som (opcional, com volume próprio): nasce aqui, logo depois da tecla ou do toque que abriu
    const sound = createDomainSound();
    const played = { impact: false, rise: false };
    const volumeInput = root.querySelector('.dx-volume');
    const muteButton = root.querySelector('.dx-mute');
    let lastVolume = savedVolume() || 0.55;
    const syncMute = (v) => {
      muteButton.dataset.muted = v <= 0.001 ? 'true' : 'false';
      muteButton.setAttribute('aria-pressed', v <= 0.001 ? 'true' : 'false');
    };
    const onVolume = () => {
      const v = Number(volumeInput.value);
      if (v > 0.001) lastVolume = v;
      sound?.setVolume(v);
      syncMute(v);
    };
    const onMute = () => {
      const v = Number(volumeInput.value) > 0.001 ? 0 : lastVolume;
      volumeInput.value = String(v);
      onVolume();
    };
    // Os controles não contam como "clique para sair"
    const keep = (e) => e.stopPropagation();
    volumeInput.value = String(savedVolume());
    syncMute(Number(volumeInput.value));
    volumeInput.addEventListener('input', onVolume);
    muteButton.addEventListener('click', onMute);
    const controls = root.querySelector('.dx-sound');
    controls.addEventListener('pointerdown', keep);

    // Lente sobre a página real: enquanto o vazio abre, a cena 3D e a barra do topo são puxadas e
    // torcidas na direção do ponto de ativação (transformação no compositor: sem custo de pintura;
    // um filtro SVG de deslocamento na cena segurava a página ~120 ms). Tudo volta ao normal quando o
    // vazio cobre a tela (ninguém vê a troca)
    const lensTargets = [document.querySelector('[data-scene]'), document.querySelector('header')].filter(Boolean);
    const lensSaved = lensTargets.map((el) => ({
      el, transform: el.style.transform, origin: el.style.transformOrigin, will: el.style.willChange,
    }));
    let lensOn = !reduced;
    if (lensOn) {
      lensTargets.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.willChange = 'transform';
        el.style.transformOrigin = `${origin.x - r.left}px ${origin.y - r.top}px`;
      });
    }
    const setLens = (k) => {
      if (!lensOn) return;
      lensTargets.forEach((el, i) => {
        // A cena é puxada para dentro (encolhe e gira); a barra, um pouco menos
        const pull = i === 0 ? 0.14 : 0.1;
        el.style.transform = k > 0.001 ? `scale(${1 - pull * k}) rotate(${-3 * k}deg)` : '';
      });
    };
    const releaseLens = () => {
      if (!lensOn) return;
      lensOn = false;
      lensSaved.forEach(({ el, transform, origin: o, will }) => {
        el.style.transform = transform;
        el.style.transformOrigin = o;
        el.style.willChange = will;
      });
    };

    // Peças voando: nascem dentro do orbe (z = 0, perto do centro) e só aparecem ao passar da borda
    // dele; com a perspectiva crescem e passam pela câmera. As da história são lentas e grandes
    // (dá para ler); as da enxurrada, rápidas, e se desfazem em partículas na saturação
    const flying = [];
    const sparks = [];
    let spawnAcc = 0;
    let storyAt = 0;
    let storyIndex = 0;
    let floodIndex = 0;
    const project = (a, d, z) => {
      const persp = 1 / Math.max(0.05, 1 - z);
      // Nascem já na borda do buraco (0,2 da tela) e saem dali: antes nasciam escondidas dentro
      // dele e muitas apagavam antes de aparecer
      const r = (unit * 0.19 + d * unit * 0.08) * persp;
      return [w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, persp];
    };
    const launch = (s, legible) => flying.push({
      s,
      legible,
      a: Math.random() * Math.PI * 2,
      d: legible ? 0.55 + Math.random() * 0.5 : 0.35 + Math.random() * 1.1,
      z: 0,
      speed: legible ? 0.17 : 0.24 + Math.random() * 0.12,
      rot: (Math.random() - 0.5) * (legible ? 0.18 : 0.5),
      spin: (Math.random() - 0.5) * (legible ? 0.5 : 2.4),
      flip: legible ? 0 : Math.random() * Math.PI * 2,
    });
    const drawItems = (dt, age, info, sat, orbR) => {
      ictx.clearRect(0, 0, w, h);
      const active = age > close + 0.1;
      if (active && !reduced) {
        // A história, uma peça de cada vez, até a enxurrada começar
        if (info < FLOOD_AT && storyIndex < pieces.story.length && age - storyAt > 0.36) {
          storyAt = age;
          launch(pieces.story[storyIndex], true);
          storyIndex += 1;
        }
        if (info >= FLOOD_AT * 0.7 && pieces.flood.length) {
          const k = clamp01((info - FLOOD_AT * 0.7) / (1 - FLOOD_AT * 0.7));
          spawnAcc += dt * (4 + 42 * k * k + 70 * sat) * density;
          while (spawnAcc > 1) {
            spawnAcc -= 1;
            launch(pieces.flood[floodIndex % pieces.flood.length], false);
            floodIndex += 1;
          }
        }
        // No pico, a informação deixa de ser legível: vira partícula correndo para fora
        const grain = clamp01((info - 0.75) / 0.25) * 90 + sat * 520;
        let sparkAcc = dt * grain * density;
        while (sparkAcc > 0 && sparks.length < 700) {
          if (sparkAcc < 1 && Math.random() > sparkAcc) break;
          sparkAcc -= 1;
          sparks.push({ a: Math.random() * Math.PI * 2, d: 0.6 + Math.random() * 1.4, z: 0, speed: 0.5 + Math.random() * 0.9 });
        }
      }
      // Partículas: riscos que se esticam com a velocidade
      if (sparks.length) {
        ictx.lineCap = 'round';
        for (let i = sparks.length - 1; i >= 0; i -= 1) {
          const sp = sparks[i];
          sp.z += dt * sp.speed * (1 + sat * 2);
          if (sp.z > 0.96) { sparks.splice(i, 1); continue; }
          const [x1, y1] = project(sp.a, sp.d, sp.z);
          const [x0, y0] = project(sp.a, sp.d, Math.max(0, sp.z - 0.05 - sat * 0.08));
          const dist = Math.hypot(x1 - w / 2, y1 - h / 2);
          if (dist < orbR) continue;
          ictx.strokeStyle = `rgba(190, 215, 255, ${0.55 * (1 - sp.z)})`;
          ictx.lineWidth = 0.6 + sp.z * 2.2;
          ictx.beginPath();
          ictx.moveTo(x0, y0);
          ictx.lineTo(x1, y1);
          ictx.stroke();
        }
      }
      for (let i = flying.length - 1; i >= 0; i -= 1) {
        const f = flying[i];
        f.z += dt * f.speed * (1 + sat * 1.6);
        if (f.z > 0.95) { flying.splice(i, 1); continue; }
        const [x, y, p] = project(f.a, f.d, f.z);
        const dist = Math.hypot(x - w / 2, y - h / 2);
        // Saindo do orbe: invisível dentro dele, aparece ao cruzar a borda
        const emerge = clamp01((dist - orbR * 0.92) / (orbR * 0.3));
        // Na saturação as peças se desfazem (somem antes de chegar)
        const alpha = emerge * (1 - clamp01((f.z - 0.72) / 0.23)) * (1 - sat * 0.55);
        if (alpha <= 0.01) continue;
        const scale = p * (f.legible ? 0.42 : 0.34) * (small ? 0.8 : 1);
        // Giro 3D falso: a peça vira em torno do próprio eixo (encolhe na largura)
        const flipX = f.legible ? 1 : 0.35 + 0.65 * Math.abs(Math.cos(f.flip + f.z * f.spin * 3));
        ictx.save();
        ictx.globalAlpha = alpha;
        ictx.translate(x, y);
        ictx.rotate(f.rot + f.spin * f.z * 0.6);
        ictx.scale(scale * flipX, scale);
        ictx.shadowColor = 'rgba(120, 170, 255, 0.55)';
        ictx.shadowBlur = f.legible ? 24 : 14;
        ictx.drawImage(f.s.c, -f.s.w / 2, -f.s.h / 2, f.s.w, f.s.h);
        // Fragmentando: cópias deslocadas em vermelho/ciano (a peça já não se sustenta)
        if (sat > 0.2) {
          const off = sat * 9;
          ictx.shadowBlur = 0;
          ictx.globalCompositeOperation = 'lighter';
          ictx.globalAlpha = alpha * 0.32 * sat;
          ictx.drawImage(f.s.c, -f.s.w / 2 - off, -f.s.h / 2, f.s.w, f.s.h);
          ictx.drawImage(f.s.c, -f.s.w / 2 + off, -f.s.h / 2, f.s.w, f.s.h);
        }
        ictx.restore();
      }
    };

    // Onde está o mouse (o olho acompanha; no congelamento o cursor fica preso aqui)
    const pointerAt = { x: origin.x, y: origin.y };
    const onPointer = (e) => {
      pointerAt.x = e.clientX;
      pointerAt.y = e.clientY;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    const frozenCursor = root.querySelector('.dx-frozen-cursor');
    let frozen = false;
    const setFrozen = (on) => {
      if (frozen === on) return;
      frozen = on;
      root.classList.toggle('is-frozen', on);
      document.documentElement.classList.toggle('dx-frozen', on);
      if (on) frozenCursor.style.transform = `translate(${pointerAt.x}px, ${pointerAt.y}px)`;
      sound?.freeze(on);
    };

    // Estado da animação
    const start = performance.now() / 1000;
    let exitAt = start + close + DOMAIN.void;
    let satStart = exitAt - SATURATE.natural;
    let raf = 0;
    let last = start;
    let covered = false;
    let count = 0;
    let travel = 0;
    let rebuild = null;
    let targets = null;
    let finished = false;

    // Elementos que vão ser reconstruídos: só os visíveis agora (onde a pessoa está na página),
    // medidos e descritos (texto, imagem, caixa) no começo da saturação e escondidos (o vazio ainda
    // cobre tudo, ninguém vê); cada um reaparece quando o caco dele encaixa
    const collectTargets = () => {
      if (targets) return;
      const items = [...document.querySelectorAll(TARGETS)]
        .filter((el) => !el.closest('.dx'))
        .filter((el) => {
          const cs = getComputedStyle(el);
          return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
        })
        .map((el) => ({ el, rect: el.getBoundingClientRect() }));
      targets = pickTargets(items, w, h).map((t) => ({ ...t, look: describe(t.el, t.rect, origin, w, h) }));
      targets.forEach((t) => t.el.classList.add('dx-hidden'));
    };
    const restoreAll = () => targets?.forEach((x) => x.el.classList.remove('dx-hidden'));
    const reveal = (el) => {
      el.classList.remove('dx-hidden');
      el.animate?.([
        // Sem filtro (desfoque e brilho em dezenas de elementos de uma vez pesavam na pintura)
        { opacity: 0, transform: 'scale(1.03)' },
        { opacity: 1, transform: 'scale(1)' },
      ], { duration: 420, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      document.documentElement.classList.remove('dx-frozen');
      releaseLens();
      restoreAll();
      onDone();
    };

    const leave = () => {
      const now = performance.now() / 1000;
      if (now < start + close || rebuild || now >= satStart) return;
      satStart = now;
      exitAt = now + SATURATE.early;
    };
    const onKey = (e) => { if (e.key === 'Escape') leave(); };
    // A tela mudou de tamanho no meio: as medidas não valem mais, a página volta como está
    const onResize = () => finish();
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
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
      const fillers = Array.from({ length: small ? 9 : 14 }, () => [Math.random() * w, Math.random() * h]);
      const cells = voronoiCells([...sites, ...fillers], w, h).map((c) => {
        const target = c.index < targets.length ? targets[c.index] : null;
        const dist = Math.hypot(c.center[0] - origin.x, c.center[1] - origin.y) / diag;
        return {
          ...c,
          target,
          from: resample(c.poly, POINTS),
          to: target ? resample(rectPoly(target.rect), POINTS) : null,
          delay: dist * 0.5 + Math.random() * 0.08,
          dur: 0.72 + Math.random() * 0.2,
          vx: (c.center[0] - origin.x) * (0.4 + Math.random() * 0.4),
          vy: (c.center[1] - origin.y) * (0.4 + Math.random() * 0.4),
          landed: 0,
        };
      });
      rebuild = { frozen, cells, at: performance.now() / 1000, pulseAt: 0, total: cells.filter((c) => c.target).length, landedCount: 0 };
      sound?.shatter();
    };

    // O conteúdo do elemento que o caco carrega, montando-se conforme o caco chega (a = 0..1)
    const drawContent = (look, rect, a, fade) => {
      if (fade <= 0.01) return;
      if (look.img) {
        sctx.globalAlpha = a * fade;
        const r = look.imgRect;
        sctx.drawImage(look.img, r.left, r.top, r.width, r.height);
      }
      if (look.box) {
        // A caixa se recompõe pela borda: o contorno corre em volta até fechar
        const per = 2 * (rect.width + rect.height);
        sctx.save();
        roundedPath(sctx, rect, look.box.radius);
        sctx.setLineDash([per * easeOut(a), per]);
        sctx.globalAlpha = fade;
        sctx.strokeStyle = 'rgba(225, 238, 255, 0.95)';
        sctx.lineWidth = 1.6;
        sctx.shadowColor = 'rgba(140, 200, 255, 0.9)';
        sctx.shadowBlur = 10;
        sctx.stroke();
        sctx.restore();
      }
      if (look.text) {
        const { glyphs } = look.text;
        let font = '';
        let color = '';
        sctx.save();
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.shadowColor = 'rgba(150, 200, 255, 0.85)';
        sctx.shadowBlur = 6 * (1 - a) + 2;
        for (const g of glyphs) {
          const ga = clamp01((a - g.lag) / (1 - g.lag));
          if (ga <= 0) continue;
          if (g.font !== font) { font = g.font; sctx.font = font; }
          if (g.color !== color) { color = g.color; sctx.fillStyle = color; }
          const off = (1 - easeOut(ga)) ** 2;
          sctx.globalAlpha = ga * fade;
          if (off > 0.002) {
            sctx.save();
            sctx.translate(g.x + g.sx * off, g.y + g.sy * off);
            sctx.rotate(g.rot * off);
            sctx.fillText(g.ch, 0, 0);
            sctx.restore();
          } else {
            sctx.fillText(g.ch, g.x, g.y);
          }
        }
        sctx.restore();
      }
      sctx.globalAlpha = 1;
    };

    // Encerramento: o pulso de luz percorre a interface a partir do impacto e o hanko assina
    const startPulse = (now) => {
      rebuild.pulseAt = now;
      setTimeout(() => sound?.stamp(), 120);
      const hanko = root.querySelector('.dx-hanko');
      gsap.timeline()
        .fromTo(hanko, { opacity: 0, scale: 1.7, rotate: -14 }, { opacity: 1, scale: 1, rotate: -6, duration: 0.32, ease: 'hanko' })
        .to(hanko, { opacity: 0, scale: 0.96, duration: 0.35, ease: 'power2.in' }, '+=0.45');
    };
    const drawPulse = (now) => {
      const t = (now - rebuild.pulseAt) / 0.9;
      if (t >= 1) return false;
      const diag = Math.hypot(w, h);
      const r = easeOut(t) * diag;
      const band = 70 + 120 * t;
      const g = sctx.createRadialGradient(origin.x, origin.y, Math.max(0, r - band), origin.x, origin.y, r + 8);
      g.addColorStop(0, 'rgba(160, 205, 255, 0)');
      g.addColorStop(0.75, `rgba(190, 220, 255, ${0.22 * (1 - t)})`);
      g.addColorStop(1, 'rgba(235, 245, 255, 0)');
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, w, h);
      return true;
    };

    const drawRebuild = (now) => {
      const s = now - rebuild.at;
      sctx.clearRect(0, 0, w, h);
      let busy = false;
      // Rachaduras acesas sobre o branco nos primeiros instantes
      const crack = clamp01(s / 0.1) * (1 - clamp01((s - 0.12) / 0.2));
      rebuild.cells.forEach((c) => {
        const k = ease(clamp01((s - 0.16 - c.delay) / c.dur));
        let pts;
        let alpha;
        if (c.to) {
          pts = c.from.map((p, i) => [p[0] + (c.to[i][0] - p[0]) * k, p[1] + (c.to[i][1] - p[1]) * k]);
          // No meio do voo o caco cresce um pouco (vem na direção da câmera) e volta ao tamanho
          const bulge = 1 + 0.14 * Math.sin(Math.PI * k);
          const cx = pts.reduce((m, p) => m + p[0], 0) / pts.length;
          const cy = pts.reduce((m, p) => m + p[1], 0) / pts.length;
          pts = pts.map(([x, y]) => [cx + (x - cx) * bulge, cy + (y - cy) * bulge]);
          alpha = 1 - k * 0.9;
          if (k >= 1 && !c.landed) {
            c.landed = now;
            rebuild.landedCount += 1;
            reveal(c.target.el);
          }
          if (!c.landed || now - c.landed < 0.45) busy = true;
        } else {
          // Enchimento: se desfaz em pó, afastando-se do impacto
          const ft = Math.max(0, s - 0.16 - c.delay);
          pts = c.from.map(([x, y]) => [x + c.vx * ft * 0.5, y + c.vy * ft * 0.5 + 300 * ft * ft]);
          alpha = 1 - clamp01(ft / 0.55);
          if (alpha > 0) busy = true;
        }
        const settled = c.landed && now - c.landed > 0.45;
        if (alpha > 0.01 && !settled) {
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
          sctx.globalAlpha = 1;
          // A imagem vem dentro do próprio caco (pedaços da foto se juntando)
          if (c.target?.look.img) drawContent({ img: c.target.look.img, imgRect: c.target.look.imgRect }, c.target.rect, clamp01((k - 0.25) / 0.75), c.landed ? 1 - (now - c.landed) / 0.45 : 1);
          sctx.restore();
          sctx.strokeStyle = `rgba(240, 248, 255, ${Math.max(crack, 0.75 * alpha)})`;
          sctx.lineWidth = 1.2;
          sctx.shadowColor = 'rgba(150, 205, 255, 0.9)';
          sctx.shadowBlur = 8;
          sctx.stroke();
          sctx.restore();
        }
        // Glifos e contorno: soltos (não presos ao caco), chegando de longe até o lugar exato
        if (c.target && !settled) {
          const look = c.target.look;
          const a = clamp01((k - 0.2) / 0.8);
          const fade = c.landed ? 1 - (now - c.landed) / 0.25 : 1;
          drawContent({ text: look.text, box: look.box }, c.target.rect, a, fade);
        }
        // Encaixou: o contorno do elemento acende e apaga
        if (c.landed && now - c.landed < 0.4) {
          const r = c.target.rect;
          const glow = 1 - (now - c.landed) / 0.4;
          sctx.save();
          sctx.strokeStyle = `rgba(200, 230, 255, ${0.7 * glow})`;
          sctx.lineWidth = 1.2;
          sctx.shadowColor = 'rgba(140, 200, 255, 0.9)';
          sctx.shadowBlur = 14;
          roundedPath(sctx, r, c.target.look.box?.radius ?? 4);
          sctx.stroke();
          sctx.restore();
        }
      });
      // O branco da saturação ainda some por cima no começo
      if (s < 0.35) {
        sctx.fillStyle = `rgba(240, 246, 255, ${0.85 * (1 - s / 0.35)})`;
        sctx.fillRect(0, 0, w, h);
      }
      // Tudo encaixado (ou o tempo da reconstrução acabou): pulso e hanko
      if (!rebuild.pulseAt && (rebuild.landedCount >= rebuild.total || s > DOMAIN.shatter)) startPulse(now);
      const pulsing = rebuild.pulseAt ? drawPulse(now) : false;
      const signing = rebuild.pulseAt && now - rebuild.pulseAt < 1.15;
      return busy || pulsing || signing || s < 0.5;
    };

    const tick = () => {
      if (finished) return;
      const t = performance.now() / 1000;
      const dt = Math.min(1 / 30, t - last);
      last = t;
      const age = t - start;

      if (!rebuild && t < exitAt) {
        // 無量空処 em quem está dentro: no pico, tudo para (o tempo do vazio, as peças, o contador,
        // o cursor e o som) e depois desaba na saturação. Esc continua saindo
        const freezeEnd = satStart - FREEZE.lead;
        const inFreeze = !reduced && t > freezeEnd - FREEZE.length && t < freezeEnd && freezeEnd - FREEZE.length > start + close + 1;
        setFrozen(inFreeze);
        if (frozen) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const sat = reduced ? 0 : clamp01((t - satStart) / (exitAt - satStart));
        const info = clamp01((age - close) / Math.max(0.1, satStart - start - close));
        if (sat > 0) collectTargets();
        // Expansão a partir de 0,8 s (depois da pincelada), clarão no fim dela e o orbe crescendo
        const rk = reduced ? 1 : clamp01((age - 0.8) / (close - 0.8));
        const opening = ease(rk);
        const flash = Math.max(0, 1 - Math.abs(age - close) / 0.25) * 0.35 + sat ** 2.2 * 1.4;
        const ok = clamp01((age - close + 0.2) / 0.9);
        const orb = reduced ? 1 : Math.max(0, 1 - (1 - ok) ** 3 * Math.cos(ok * 4));
        const warp = reduced ? 0 : 0.4 + 2.6 * Math.exp(-((age - close - 0.9) ** 2) / 0.6) + info * 1.2 + sat * 5;
        travel += dt * (0.15 + warp * 0.45);
        voidGl?.draw({ time: age, reveal: opening, origin: glOrigin, orb, warp, flash, travel });
        if (!played.impact && age > 0.78) {
          played.impact = true;
          sound?.impact();
        }
        if (!played.rise && sat > 0) {
          played.rise = true;
          sound?.rise(Math.max(0.2, exitAt - t));
        }
        if (!covered) setLens(ease(clamp01((age - 0.25) / (close - 0.25))));
        if (!covered && opening >= 1) {
          covered = true;
          releaseLens();
          journeyStore.getState().setCovered(true);
        }
        drawItems(dt, age, info, sat, 0.2 * orb * h);
        // Tremor da saturação: a tela inteira não aguenta tanta informação
        const shake = sat * sat * (small ? 3 : 7);
        const tx = (Math.random() - 0.5) * shake;
        const ty = (Math.random() - 0.5) * shake;
        layers.forEach((c) => { c.style.transform = shake ? `translate(${tx}px, ${ty}px)` : ''; });
        // Contador da informação infinita: começa contido, acelera e dispara além do legível
        if (age > close + 0.4) {
          count += dt * (600 + count * (0.9 + info * 2.4 + sat * 10));
          counter.textContent = Math.floor(count).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR');
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      if (!rebuild) {
        if (reduced) {
          finish();
          return;
        }
        startRebuild();
      }
      if (drawRebuild(t)) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      cancelSprites();
      tl.kill();
      gsap.killTweensOf(root.querySelectorAll('*'));
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.classList.remove('dx-frozen');
      root.removeEventListener('pointerdown', leave);
      volumeInput.removeEventListener('input', onVolume);
      muteButton.removeEventListener('click', onMute);
      controls.removeEventListener('pointerdown', keep);
      releaseLens();
      sound?.dispose();
      journeyStore.getState().setCovered(false);
      // Nada fica escondido se o domínio sair no meio (troca de rota, erro)
      restoreAll();
      voidGl?.dispose();
    };
  }, [origin, onDone]);

  const en = typeof document !== 'undefined' && document.documentElement.getAttribute('data-language') === 'en';
  return (
    <div ref={rootRef} className="dx" data-domain="">
      <div className="dx-dim" aria-hidden="true" />
      <canvas ref={glRef} className="dx-layer" aria-hidden="true" />
      <canvas ref={itemsRef} className="dx-layer" aria-hidden="true" />
      <canvas ref={shardRef} className="dx-layer" aria-hidden="true" />
      <HandSeal />
      <div className="dx-type" aria-hidden="true">
        <div className="dx-intro">
          <p className="dx-intro-jp font-jp" lang="ja">
            {[...'領域展開'].map((c) => <span key={c} className="dx-intro-char">{c}</span>)}
          </p>
          <span className="dx-brush" />
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
        <div className="dx-captions">
          <p className="dx-caption dx-caption-1">{[...'“Ryōiki tenkai.”'].map((c, i) => <span key={i} className="dx-caption-char">{c}</span>)}</p>
          <p className="dx-caption dx-caption-2">{[...'“Muryōkūsho.”'].map((c, i) => <span key={i} className="dx-caption-char">{c}</span>)}</p>
        </div>
      </div>
      {/* O cursor preso no lugar enquanto o domínio congela tudo */}
      <span className="dx-frozen-cursor" aria-hidden="true" />
      {/* Som: liga/desliga e volume (guardado para a próxima vez) */}
      <div className="dx-sound">
        <button type="button" className="dx-mute" aria-label={en ? 'Mute the domain sound' : 'Silenciar o som do domínio'} aria-pressed="false">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
            <path className="dx-mute-waves" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path className="dx-mute-x" d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <input className="dx-volume" type="range" min="0" max="1" step="0.05" aria-label={en ? 'Domain sound volume' : 'Volume do som do domínio'} />
      </div>
      {/* 判子: o carimbo vermelho que assina a reconstrução */}
      <div className="dx-hanko font-jp" lang="ja" aria-hidden="true">
        <span>奥</span>
        <span>山</span>
      </div>
    </div>
  );
}
