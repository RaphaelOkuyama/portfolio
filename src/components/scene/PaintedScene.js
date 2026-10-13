'use client';
import { useEffect, useRef } from 'react';
import { journeyStore } from '../../store/journey';
import { SEASONS, SCENE_ACCENTS } from '../../lib/palette';
import { FROZEN_PROGRESS, lerpHex, sampleSeason, SEASON_NAMES } from '../../lib/journey/season';
import { mulberry32 } from '../../lib/journey/ridge';
import { ridgeY, riverAt, riverPath } from '../../lib/journey/backdrop';
import { isSceneClick } from '../../lib/journey/sceneClick';
import { BACKDROP } from './StaticBackdrop';

// 山水: a montanha pintada e animada, para quem não tem GPU (lib/webgl). Tudo em Canvas 2D na CPU,
// pensado para rodar liso assim mesmo:
//  · o canvas tem só uma fração dos pixels da tela (o navegador amplia; o traço pintado aguenta)
//  · céu, cristas, névoa e o rio com o torii são pintados uma vez por tema e estação, em camadas
//    guardadas; cada quadro só cola as camadas deslocadas (profundidade com a rolagem e o mouse) e
//    desenha o que se mexe: estrelas piscando, estrela cadente, névoa correndo, o brilho no rio, as
//    lanternas descendo a correnteza, as carpas, a luz dos tōrō e as partículas da estação
//  · o quadro é medido: se custar caro, cai para 30 fps e depois para menos pixels
// Coordenadas de desenho: as do fundo SVG (1600×900, ancorado embaixo e no meio, cobrindo a tela)

const { W, H, FAR, MID, NEAR, MID_TREES, NEAR_TREES, RIVER_SPEC: BASE_RIVER } = BACKDROP;
// Margem em volta das camadas: espaço para o deslocamento e o zoom não mostrarem a borda
const M = 150;
// Profundidade de cada camada (0 no infinito, 1 na crista da frente)
const DEPTH = { sky: 0.02, moon: 0.06, far: 0.22, mistFar: 0.32, mid: 0.52, mistMid: 0.7, near: 1 };
// Fração dos pixels da tela no canvas (o primeiro valor; cai se o quadro custar caro)
const PIXELS = [0.75e6, 0.5e6, 0.32e6];
const MOON = { x: 1210, y: 190 };
const TORII_X = W / 2 - 340;
const TORO = [TORII_X - 92, TORII_X + 96];
// O rio continua abaixo da borda: com a rolagem a camada da frente sobe e ele não pode acabar à vista
const RIVER_SPEC = { ...BASE_RIVER, bottomY: H + M, bottomWidth: 980 };
const RIVER = riverPath(RIVER_SPEC);
const RIVER_GLINT = riverPath({ ...RIVER_SPEC, topX: RIVER_SPEC.topX + 6, topY: RIVER_SPEC.topY + 30, topWidth: 2, bottomWidth: 110, sway: 150 });

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function palette(theme, season) {
  const s = SEASONS[theme][season];
  const accents = SCENE_ACCENTS[theme];
  const [near, mid, far] = s.mountains;
  return { theme, season: SEASON_NAMES[season], night: theme === 'night', sky: s.sky, fog: s.fog, near, mid, far, accents };
}

function layerCanvas(scale, height = H + 2 * M) {
  const c = document.createElement('canvas');
  c.width = Math.ceil((W + 2 * M) * scale);
  c.height = Math.ceil(height * scale);
  const ctx = c.getContext('2d');
  return { c, ctx };
}

// Canvas pequeno para formas suaves: pintado a 1/12 da escala de desenho, ampliado ao colar
const SOFT = 1 / 12;
function soft(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.ceil(w * SOFT));
  c.height = Math.max(2, Math.ceil(h * SOFT));
  const ctx = c.getContext('2d');
  ctx.scale(SOFT, SOFT);
  paint(ctx);
  return c;
}

// Camada de crista recortada: só da crista (menos a altura das árvores) para baixo. Acima dela seria
// céu transparente, e colar pixels transparentes custa o mesmo que os outros
function ridgeLayer(scale, points, above) {
  const top = Math.min(...points.map(([, y]) => y)) - above;
  const { c, ctx } = layerCanvas(scale, H + M - top);
  ctx.setTransform(scale, 0, 0, scale, M * scale, -top * scale);
  return { c, ctx, top };
}

// Crista preenchida até embaixo, com a névoa do vale subindo e a luz do céu riscando o topo
function paintRidge(ctx, points, color, p, rim) {
  const top = Math.min(...points.map(([, y]) => y));
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, color);
  g.addColorStop(1, lerpHex(color, p.fog, 0.3));
  ctx.beginPath();
  ctx.moveTo(-M, H + M);
  ctx.lineTo(-M, points[0][1]);
  points.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(W + M, points[points.length - 1][1]);
  ctx.lineTo(W + M, H + M);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = rgba(p.night ? p.accents.celestial : '#ffffff', rim);
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Torii e dois tōrō (o corpo; a luz acende por quadro)
function paintShrine(ctx, p) {
  const base = ridgeY(NEAR, TORII_X) + 6;
  const color = lerpHex(p.near, p.accents.torii, p.night ? 0.55 : 0.85);
  const h = 118;
  ctx.fillStyle = color;
  [-40, 40].forEach((dx) => ctx.fillRect(TORII_X + dx - 5, base - h, 10, h));
  // Kasagi: a viga de cima, com as pontas viradas para cima
  ctx.beginPath();
  ctx.moveTo(TORII_X - 76, base - h - 10);
  ctx.quadraticCurveTo(TORII_X, base - h + 4, TORII_X + 76, base - h - 10);
  ctx.lineTo(TORII_X + 70, base - h + 2);
  ctx.quadraticCurveTo(TORII_X, base - h + 14, TORII_X - 70, base - h + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lerpHex(p.near, p.accents.toriiTop, 0.6);
  ctx.fillRect(TORII_X - 72, base - h - 14, 144, 5);
  ctx.fillStyle = color;
  ctx.fillRect(TORII_X - 56, base - h + 26, 112, 7);
  ctx.fillRect(TORII_X - 3, base - h + 8, 6, 20);
  ctx.fillStyle = lerpHex(p.near, p.accents.granite, 0.35);
  TORO.forEach((x) => {
    const y = ridgeY(NEAR, x) + 6;
    ctx.fillRect(x - 3, y - 26, 6, 26);
    ctx.fillRect(x - 9, y - 40, 18, 14);
    ctx.beginPath();
    ctx.moveTo(x - 13, y - 40);
    ctx.lineTo(x, y - 50);
    ctx.lineTo(x + 13, y - 40);
    ctx.fill();
  });
}

// As camadas de um tema e estação, pintadas aos poucos (um passo por chamada) para nenhuma tarefa
// longa travar a página. Devolve { steps, layers }
function buildSet(p, scale) {
  const layers = {};
  const rand = mulberry32(17);
  const steps = [
    () => {
      const { c, ctx } = layerCanvas(scale);
      ctx.setTransform(scale, 0, 0, scale, M * scale, M * scale);
      const g = ctx.createLinearGradient(0, -M, 0, H);
      g.addColorStop(0, p.night ? lerpHex(p.sky, '#05060f', 0.45) : lerpHex(p.sky, '#ffffff', 0.25));
      g.addColorStop(0.55, p.sky);
      g.addColorStop(0.8, p.fog);
      ctx.fillStyle = g;
      ctx.fillRect(-M, -M, W + 2 * M, H + 2 * M);
      if (p.night) {
        // Poeira de estrelas fixa (as que piscam são desenhadas por quadro)
        for (let i = 0; i < 260; i += 1) {
          const y = rand() * H * 0.62 - M;
          ctx.fillStyle = rgba(p.accents.celestial, (0.12 + rand() * 0.4) * (1 - y / (H * 0.62)));
          ctx.fillRect(rand() * (W + 2 * M) - M, y, 1.4, 1.4);
        }
      } else {
        // Nuvens altas e suaves (pintadas pequenas: a ampliação desfoca de graça)
        const clouds = soft(W, 420, (cx) => {
          for (let i = 0; i < 9; i += 1) {
            cx.fillStyle = rgba('#ffffff', 0.25 + rand() * 0.25);
            cx.beginPath();
            cx.ellipse(rand() * W, 60 + rand() * 260, 120 + rand() * 160, 18 + rand() * 22, 0, 0, Math.PI * 2);
            cx.fill();
          }
        });
        ctx.drawImage(clouds, 0, 0, W, 420);
      }
      layers.sky = c;
    },
    () => {
      // Lua (ou sol): halo largo, disco e, à noite, os mares
      const size = 560;
      const c = document.createElement('canvas');
      c.width = c.height = Math.ceil(size * scale);
      const ctx = c.getContext('2d');
      ctx.setTransform(scale, 0, 0, scale, (size / 2) * scale, (size / 2) * scale);
      const halo = ctx.createRadialGradient(0, 0, 30, 0, 0, size / 2);
      halo.addColorStop(0, rgba(p.accents.celestial, p.night ? 0.5 : 0.65));
      halo.addColorStop(0.25, rgba(p.accents.celestial, p.night ? 0.16 : 0.25));
      halo.addColorStop(1, rgba(p.accents.celestial, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      const disc = ctx.createRadialGradient(-12, -14, 4, 0, 0, 48);
      disc.addColorStop(0, lerpHex(p.accents.celestial, '#ffffff', 0.5));
      disc.addColorStop(1, p.accents.celestial);
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(0, 0, 47, 0, Math.PI * 2);
      ctx.fill();
      if (p.night) {
        ctx.fillStyle = rgba('#8a8070', 0.12);
        [[-14, -8, 13], [12, 10, 9], [6, -18, 6], [-6, 18, 7]].forEach(([x, y, r]) => {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      layers.moon = c;
    },
    () => {
      const { c, ctx, top } = ridgeLayer(scale, FAR, 6);
      paintRidge(ctx, FAR, p.far, p, p.night ? 0.22 : 0.35);
      layers.far = { c, top };
    },
    () => {
      // Faixa de névoa: manchas pintadas num canvas minúsculo (a ampliação as desfoca sem custo,
      // um filtro de blur na CPU levava dezenas de ms) e arrastadas por quadro
      const bandH = 280;
      const span = W + 2 * M;
      const c = soft(span, bandH, (cx) => {
        cx.translate(M, 0);
        // Cada mancha também do outro lado da faixa: ela se repete na horizontal sem emenda
        for (let i = 0; i < 22; i += 1) {
          cx.fillStyle = rgba(p.fog, 0.22 + rand() * 0.3);
          const x = rand() * span - M;
          const y = bandH / 2 + (rand() - 0.5) * 70;
          const rx = 120 + rand() * 200;
          const ry = 26 + rand() * 30;
          cx.beginPath();
          [-span, 0, span].forEach((dx) => {
            cx.moveTo(x + dx + rx, y);
            cx.ellipse(x + dx, y, rx, ry, 0, 0, Math.PI * 2);
          });
          cx.fill();
        }
      });
      layers.mist = c;
    },
    () => {
      const { c, ctx, top } = ridgeLayer(scale, MID, 34);
      paintRidge(ctx, MID, p.mid, p, p.night ? 0.16 : 0.28);
      ctx.fillStyle = p.mid;
      ctx.fill(new Path2D(MID_TREES));
      layers.mid = { c, top };
    },
    () => {
      // O torii passa da crista: a camada começa acima dele
      const { c, ctx, top } = ridgeLayer(scale, NEAR, 150);
      paintRidge(ctx, NEAR, p.near, p, p.night ? 0.12 : 0.22);
      ctx.fillStyle = p.near;
      ctx.fill(new Path2D(NEAR_TREES));
      paintShrine(ctx, p);
      const river = ctx.createLinearGradient(0, RIVER_SPEC.topY, 0, H);
      river.addColorStop(0, p.fog);
      river.addColorStop(1, p.accents.water);
      ctx.fillStyle = river;
      ctx.fill(new Path2D(RIVER));
      ctx.fillStyle = rgba(p.sky, 0.22);
      ctx.fill(new Path2D(RIVER_GLINT));
      layers.near = { c, top };
    },
  ];
  return { steps, layers };
}

// Brilho redondo pré-pintado (lanternas, tōrō, vagalumes): criar um gradiente por quadro custa caro
const glows = new Map();
function glowSprite(color) {
  if (glows.has(color)) return glows.get(color);
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, rgba(color, 1));
  g.addColorStop(0.35, rgba(color, 0.45));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glows.set(color, c);
  return c;
}

// Partícula pré-pintada (pétala ou folha: um oval; neve: um ponto), colada com transformação
const flakes = new Map();
function flakeSprite(color, round) {
  const key = color + round;
  if (flakes.has(key)) return flakes.get(key);
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 20;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.beginPath();
  if (round) ctx.arc(16, 10, 8, 0, Math.PI * 2);
  else ctx.ellipse(16, 10, 15, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  flakes.set(key, c);
  return c;
}

// Partículas da estação: pétalas, vagalumes (verão à noite; de dia, folhas novas), momiji e neve
function seasonKind(p) {
  if (p.season === 'spring') return 'petal';
  if (p.season === 'summer') return p.night ? 'firefly' : 'leaf';
  if (p.season === 'autumn') return 'momiji';
  return 'snow';
}

export default function PaintedScene({ onReady }) {
  const canvasRef = useRef(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!ctx) return undefined;
    const rand = mulberry32(2024);
    const cache = new Map();
    const state = {
      view: { w: 0, h: 0, q: 0, s: 0, ox: 0, oy: 0 },
      // Máquina modesta (poucos núcleos): já começa com menos pixels
      level: (navigator.hardwareConcurrency ?? 8) <= 4 ? 1 : 0,
      fps30: false,
      current: null,
      previous: null,
      fade: 1,
      building: null,
      pointer: { x: 0, y: 0, tx: 0, ty: 0 },
      progress: 0,
      lastInput: performance.now(),
      lastScroll: 0,
      cost: [],
      near: [1, 0, 0],
    };

    // Estrelas que piscam, estrela cadente, lanternas, carpas, ondas e partículas
    const stars = Array.from({ length: 46 }, () => ({ x: rand() * W, y: rand() * H * 0.45, ph: rand() * 6.28, w: 0.6 + rand() * 1.8, r: 1.2 + rand() * 1.4 }));
    let shooting = null;
    let nextShoot = 3 + rand() * 6;
    const lanterns = Array.from({ length: 7 }, (_, i) => ({ t: i / 7, u: (rand() - 0.5) * 1.1, sp: 0.6 + rand() * 0.6, ph: rand() * 6 }));
    const KOI = [['#f7f2ea', '#c8321e'], ['#e8a83a', '#e8a83a'], ['#f4efe6', '#1a1a1a']];
    const koi = KOI.map(([body, spot], i) => ({ body, spot, t: 0.68 + i * 0.09, u: (rand() - 0.5) * 0.8, a: rand() * 6.28, sp: 0.05 + rand() * 0.03, wander: null, beat: rand() * 6 }));
    const ripples = [];
    let lure = null;
    let shown = false;
    let particles = [];
    let kind = null;

    const store = journeyStore.getState();
    const reduced = store.reducedMotion;
    const progressOf = (st) => (st.route === 'frozen' ? FROZEN_PROGRESS : st.progress);
    state.progress = progressOf(store);

    // Tamanho: o canvas cobre a tela com uma fração dos pixels; a escala leva o desenho 1600×900 até ele
    const measure = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const q = Math.min(0.75, Math.sqrt(PIXELS[state.level] / (w * h)));
      canvas.width = Math.round(w * q);
      canvas.height = Math.round(h * q);
      const s = Math.max(canvas.width / W, canvas.height / H);
      state.view = { w, h, q, s, ox: (canvas.width - W * s) / 2, oy: canvas.height - H * s };
      const area = (w * h) / (1920 * 1080);
      if (kind) spawn(Math.round(Math.min(90, Math.max(28, 64 * area))));
    };

    const keyOf = (st) => `${st.theme}|${Math.round(Math.min(3, Math.max(0, st.seasonMix)))}`;
    const fullKey = (base) => `${base}|${state.view.s.toFixed(4)}`;
    const startBuild = (base, needed) => {
      const [theme, season] = base.split('|');
      const p = palette(theme, +season);
      state.building = { key: fullKey(base), p, needed, ...buildSet(p, state.view.s), step: 0 };
    };
    const want = () => {
      const base = keyOf(journeyStore.getState());
      const key = fullKey(base);
      if (state.current?.key === key) return;
      if (state.building?.key === key) {
        state.building.needed = true;
        return;
      }
      if (cache.has(key)) {
        swap(cache.get(key));
        return;
      }
      // A que falta agora passa na frente de uma pré-pintura em andamento
      startBuild(base, true);
    };
    const swap = (set) => {
      state.previous = state.current;
      state.current = set;
      state.fade = state.previous ? 0 : 1;
      const k = seasonKind(set.p);
      if (k !== kind) {
        kind = k;
        spawn(Math.round(Math.min(90, Math.max(28, 64 * (state.view.w * state.view.h) / (1920 * 1080)))));
      }
      canvas.dataset.theme = set.p.theme;
      canvas.dataset.season = set.p.season;
      if (!shown) {
        shown = true;
        canvas.style.opacity = '1';
        readyRef.current?.();
      }
      scheduleIdle();
    };
    // Um passo de pintura (cada um custa alguns ms; nenhum vira tarefa longa)
    const buildStep = () => {
      const b = state.building;
      if (!b) return;
      b.steps[b.step]();
      b.step += 1;
      if (b.step < b.steps.length) return;
      const set = { key: b.key, p: b.p, layers: b.layers };
      cache.set(b.key, set);
      // Guarda as quatro estações de um tema e mais uma: cada conjunto ocupa alguns MB
      if (cache.size > 5) cache.delete([...cache.keys()].find((k) => k !== state.current?.key));
      state.building = null;
      if (b.needed) swap(set);
      else scheduleIdle();
    };
    // Pré-pintura das outras estações do tema, só no tempo ocioso do navegador: rolando a página,
    // a troca de estação acha as camadas prontas
    const requestIdle = window.requestIdleCallback ?? ((fn) => setTimeout(() => fn({ timeRemaining: () => 8 }), 120));
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
    let idleId = 0;
    function scheduleIdle() {
      if (idleId || reduced) return;
      idleId = requestIdle(idleWork, { timeout: 4000 });
    }
    function idleWork(deadline) {
      idleId = 0;
      if (!state.building) {
        const theme = journeyStore.getState().theme;
        const missing = SEASON_NAMES.map((_, i) => `${theme}|${i}`).find((base) => !cache.has(fullKey(base)));
        if (!missing) return;
        startBuild(missing, false);
      }
      if (state.building.needed) return;
      while (state.building && !state.building.needed && deadline.timeRemaining() > 6) buildStep();
      scheduleIdle();
    }

    function spawn(n) {
      const { width: cw, height: ch } = canvas;
      particles = Array.from({ length: n }, () => ({
        x: rand() * cw, y: rand() * ch, z: 0.5 + rand() * 0.9, rot: rand() * 6.28, vr: (rand() - 0.5) * 2, ph: rand() * 6.28, w: 0.5 + rand(),
      }));
    }

    // Transformação de uma camada: zoom e deslocamento conforme a rolagem desce a montanha, mais um
    // pouco de deslocamento com o mouse; mais forte quanto mais perto a camada
    const setLayer = (d) => {
      const { s, ox, oy } = state.view;
      const p = state.progress;
      const z = 1 + p * d * 0.14;
      const sx = -state.pointer.x * d * 16;
      const sy = -p * d * 70 - state.pointer.y * d * 9;
      const cx = W / 2;
      const cy = H * 0.78;
      const a = s * z;
      const e = ox + (cx - cx * z + sx) * s;
      const f = oy + (cy - cy * z + sy) * s;
      ctx.setTransform(a, 0, 0, a, e, f);
      return [a, e, f];
    };
    const blit = (img, d, x = -M, y = -M, w = W + 2 * M, h = H + 2 * M) => {
      setLayer(d);
      ctx.drawImage(img, x, y, w, h);
    };
    const ridge = (layer, d) => blit(layer.c, d, -M, layer.top, W + 2 * M, H + M - layer.top);

    const draw = (time, dt) => {
      const set = state.current;
      if (!set) return;
      const prev = state.fade < 1 ? state.previous : null;
      const p = set.p;
      const L = set.layers;
      const both = (fn) => {
        if (prev) {
          fn(prev.layers, prev.p, 1);
          ctx.globalAlpha = state.fade;
        }
        fn(L, p, state.fade);
        ctx.globalAlpha = 1;
      };
      const prog = state.progress;

      both((l) => blit(l.sky, DEPTH.sky));
      // Estrelas que piscam e a estrela cadente
      if (p.night) {
        setLayer(DEPTH.sky);
        ctx.fillStyle = p.accents.celestial;
        stars.forEach((st) => {
          const k = (0.5 + 0.5 * Math.sin(time * st.w + st.ph)) ** 3;
          ctx.globalAlpha = 0.25 + 0.75 * k;
          ctx.fillRect(st.x, st.y, st.r, st.r);
        });
        ctx.globalAlpha = 1;
        nextShoot -= dt;
        if (!shooting && nextShoot < 0) {
          shooting = { x: 200 + rand() * 900, y: 40 + rand() * 160, t: 0 };
          nextShoot = 7 + rand() * 9;
        }
        if (shooting) {
          shooting.t += dt / 0.9;
          const k = shooting.t;
          const hx = shooting.x + k * 420;
          const hy = shooting.y + k * 150;
          const g = ctx.createLinearGradient(hx - 160, hy - 57, hx, hy);
          g.addColorStop(0, rgba(p.accents.celestial, 0));
          g.addColorStop(1, rgba('#ffffff', 0.9 * Math.sin(Math.PI * Math.min(1, k))));
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(hx - 160, hy - 57);
          ctx.lineTo(hx, hy);
          ctx.stroke();
          if (k >= 1) shooting = null;
        }
      }
      // A lua desce um pouco ao longo da jornada e respira
      both((l) => {
        const r = 280 * (1 + Math.sin(time * 0.6) * 0.015);
        blit(l.moon, DEPTH.moon, MOON.x - r, MOON.y + prog * 80 - r, r * 2, r * 2);
      });
      both((l) => ridge(l.far, DEPTH.far));
      // Névoa: duas faixas arrastadas devagar, em sentidos opostos
      const mist = (l, d, y, speed, alpha) => {
        const x = ((time * speed) % (W + 2 * M)) - (W + 2 * M);
        const prevA = ctx.globalAlpha;
        ctx.globalAlpha = prevA * alpha;
        blit(l.mist, d, x - M, y, W + 2 * M, 280);
        blit(l.mist, d, x + W + M, y, W + 2 * M, 280);
        blit(l.mist, d, x + 2 * W + 3 * M, y, W + 2 * M, 280);
        ctx.globalAlpha = prevA;
      };
      both((l) => mist(l, DEPTH.mistFar, 360, 9, 0.85));
      both((l) => ridge(l.mid, DEPTH.mid));
      both((l) => mist(l, DEPTH.mistMid, 520, -14, 0.7));
      both((l) => ridge(l.near, DEPTH.near));

      // Na camada da frente: o brilho correndo no rio, as lanternas, as carpas, as ondas e os tōrō
      state.near = setLayer(DEPTH.near);
      const light = p.night ? p.accents.celestial : '#ffffff';
      ctx.strokeStyle = light;
      for (let i = 0; i < (state.fps30 ? 18 : 30); i += 1) {
        const t = (i / 30 + time * 0.018) % 1;
        const r = riverAt(RIVER_SPEC, t);
        const u = Math.sin(i * 12.9898) * 0.7;
        const len = 4 + t * 46;
        ctx.globalAlpha = Math.sin(Math.PI * t) * (0.18 + 0.22 * (0.5 + 0.5 * Math.sin(time * 3 + i)));
        ctx.lineWidth = 0.6 + t * 2.2;
        ctx.beginPath();
        ctx.moveTo(r.x + u * r.half - len / 2, r.y);
        ctx.lineTo(r.x + u * r.half + len / 2, r.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // 灯籠流し: lanternas descendo o rio, mais delas no fim da jornada (e só à noite acesas)
      const lit = p.night ? Math.round(3 + prog * 4) : 2;
      lanterns.slice(0, lit).forEach((ln) => {
        ln.t = (ln.t + dt * 0.012 * ln.sp) % 1;
        const r = riverAt(RIVER_SPEC, ln.t);
        const k = 0.12 + ln.t * 1.05;
        const x = r.x + ln.u * r.half * 0.55 + Math.sin(time * 0.8 + ln.ph) * 3 * k;
        const y = r.y;
        const fadeIn = smooth(0, 0.08, ln.t) * (1 - smooth(0.9, 1, ln.t));
        if (p.night) {
          ctx.globalAlpha = 0.55 * fadeIn;
          ctx.drawImage(glowSprite(p.accents.lantern), x - 46 * k, y - 52 * k, 92 * k, 92 * k);
          ctx.globalAlpha = 1;
          ctx.globalAlpha = 0.22 * fadeIn;
          ctx.fillStyle = p.accents.lantern;
          ctx.fillRect(x - 3 * k, y, 6 * k, 16 * k);
        }
        ctx.globalAlpha = fadeIn;
        ctx.fillStyle = p.night ? '#fff1cf' : '#f6e7c8';
        ctx.fillRect(x - 6 * k, y - 13 * k, 12 * k, 12 * k);
        ctx.fillStyle = p.night ? '#3a1d10' : '#6e5a44';
        ctx.fillRect(x - 7 * k, y - 15 * k, 14 * k, 2.4 * k);
        ctx.fillRect(x - 7 * k, y - 2 * k, 14 * k, 2.4 * k);
        ctx.globalAlpha = 1;
      });
      // Carpas no trecho largo do rio (aparecem perto do fim, quando o rio fica à vista)
      const koiAlpha = smooth(0.55, 0.8, prog);
      if (koiAlpha > 0.01) {
        koi.forEach((k, i) => {
          const goal = lure ?? (k.wander ??= { t: 0.6 + rand() * 0.36, u: (rand() - 0.5) * 1.3 });
          const r0 = riverAt(RIVER_SPEC, k.t);
          const rg = riverAt(RIVER_SPEC, goal.t);
          const dx = rg.x + goal.u * rg.half - (r0.x + k.u * r0.half);
          const dy = rg.y - r0.y;
          const want = Math.atan2(dy, dx);
          let turn = want - k.a;
          turn = Math.atan2(Math.sin(turn), Math.cos(turn));
          k.a += turn * Math.min(1, dt * (lure ? 2.6 : 1.1));
          const sp = k.sp * (lure ? 2.2 : 1);
          k.t = Math.min(0.98, Math.max(0.56, k.t + Math.sin(k.a) * sp * dt * 0.5));
          k.u = Math.min(0.85, Math.max(-0.85, k.u + Math.cos(k.a) * sp * dt * 2.2));
          k.beat += dt * (lure ? 11 : 6);
          if (Math.hypot(dx, dy) < 18) {
            if (lure && i === 0) {
              ripples.push({ x: rg.x + goal.u * rg.half, y: rg.y, t: 0, big: false });
              lure = null;
            }
            k.wander = null;
          }
          const r = riverAt(RIVER_SPEC, k.t);
          const sc = 0.4 + k.t * 1.35;
          ctx.save();
          ctx.translate(r.x + k.u * r.half, r.y);
          ctx.scale(sc, sc * 0.6);
          ctx.rotate(k.a);
          ctx.globalAlpha = koiAlpha * 0.85;
          // Cauda abanando, corpo e as manchas
          const wag = Math.sin(k.beat) * 0.5;
          ctx.fillStyle = k.body;
          ctx.beginPath();
          ctx.moveTo(-14, 0);
          ctx.lineTo(-27, -7 + wag * 6);
          ctx.lineTo(-25, 7 + wag * 6);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, 0, 17, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = k.spot;
          ctx.beginPath();
          ctx.ellipse(4, -1, 6, 3.4, 0.2, 0, Math.PI * 2);
          ctx.ellipse(-6, 1, 4, 2.6, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
      // Ondas na água (cliques e mordidas)
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const rp = ripples[i];
        rp.t += dt / (rp.big ? 1.6 : 1.1);
        if (rp.t >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const rad = (rp.big ? 60 : 30) * rp.t;
        ctx.globalAlpha = 0.5 * (1 - rp.t);
        ctx.strokeStyle = light;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rad, rad * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // A luz dos tōrō, tremulando
      TORO.forEach((x, i) => {
        const y = ridgeY(NEAR, x) + 6 - 33;
        const fl = 0.75 + 0.25 * Math.sin(time * 7 + i * 2) * Math.sin(time * 3.1 + i);
        ctx.globalAlpha = (p.night ? 0.75 : 0.25) * fl;
        ctx.drawImage(glowSprite(p.accents.tourou), x - 30, y - 30, 60, 60);
        ctx.globalAlpha = 1;
      });

      // Partículas da estação, em pixels do canvas (passam na frente de tudo)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const { width: cw, height: ch } = canvas;
      const u = cw / 960;
      const live = state.fps30 ? particles.length >> 1 : particles.length;
      for (let n = 0; n < live; n += 1) {
        const pt = particles[n];
        const sway = Math.sin(time * pt.w + pt.ph);
        if (kind === 'firefly') {
          pt.x += Math.sin(time * 0.4 * pt.w + pt.ph) * 12 * u * dt;
          pt.y += Math.cos(time * 0.3 * pt.w + pt.ph * 2) * 8 * u * dt;
          const glow = (0.5 + 0.5 * Math.sin(time * 2.2 * pt.w + pt.ph)) ** 2;
          const r = 9 * u * pt.z;
          ctx.globalAlpha = 0.85 * glow;
          ctx.drawImage(glowSprite(p.accents.firefly), pt.x - r, pt.y - r, r * 2, r * 2);
          ctx.globalAlpha = 1;
        } else {
          const fall = kind === 'snow' ? 26 : 34;
          pt.x += (sway * 18 + 14) * u * pt.z * dt;
          pt.y += fall * u * pt.z * dt;
          pt.rot += pt.vr * dt;
          const snow = kind === 'snow';
          const img = flakeSprite(snow ? p.accents.snow : kind === 'petal' ? p.accents.petal : kind === 'momiji' ? p.accents.momiji : '#9fc78a', snow);
          // Gira e "vira" (achata) a pétala: uma transformação e um drawImage, sem caminho nem save
          const size = (snow ? 0.22 : 0.3) * u * pt.z;
          const flip = snow ? 1 : 0.4 + 0.6 * Math.abs(Math.sin(time * 2 * pt.w + pt.ph));
          const cs = Math.cos(pt.rot) * size;
          const sn = Math.sin(pt.rot) * size;
          ctx.globalAlpha = snow ? 0.75 : 0.85;
          ctx.setTransform(cs, sn, -sn * flip, cs * flip, pt.x, pt.y);
          ctx.drawImage(img, -16, -10);
        }
        if (pt.y > ch + 10) { pt.y = -10; pt.x = rand() * cw; }
        if (pt.x > cw + 10) pt.x = -10;
        if (pt.x < -10) pt.x = cw + 10;
        if (pt.y < -10) pt.y = ch + 10;
      }
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    // Laço: mede o custo do quadro e se adapta; parado (sem rolar nem mexer o mouse) vai a 30 fps
    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const st = journeyStore.getState();
      if (document.hidden || st.covered) {
        last = now;
        return;
      }
      // Máquina lenta: a rolagem tem prioridade. Enquanto a página rola, a cena fica parada (sem
      // repintar nada); quando a rolagem para, ela volta a se mexer e a profundidade alcança
      if (state.fps30 && now - state.lastScroll < 220) {
        last = now;
        return;
      }
      if (state.building?.needed) buildStep();
      const idle = now - state.lastInput > 3000;
      const interval = state.fps30 || idle ? 1000 / 30 : 0;
      if (now - lastDraw < interval - 2) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      lastDraw = now;
      state.progress += (progressOf(st) - state.progress) * Math.min(1, dt * 6);
      state.pointer.x += (state.pointer.tx - state.pointer.x) * Math.min(1, dt * 3);
      state.pointer.y += (state.pointer.ty - state.pointer.y) * Math.min(1, dt * 3);
      if (state.fade < 1) state.fade = Math.min(1, state.fade + dt / 0.9);
      draw(now / 1000, dt);
      // Mede o quadro inteiro (desenho, composição e o resto da página), pelo intervalo real entre
      // quadros desenhados. Fora as pausas de 30 fps quando parado, que não contam
      if (!idle && state.current && !state.building) state.cost.push(dt * 1000);
      if (state.cost.length >= 30) {
        const sorted = state.cost.slice().sort((a, b) => a - b);
        const typical = sorted[Math.floor(sorted.length / 2)];
        state.cost = [];
        // Lento: primeiro 30 fps, depois menos pixels (repinta as camadas na nova escala)
        if (!state.fps30 && typical > 22) state.fps30 = true;
        else if (state.fps30 && typical > 36 && state.level < PIXELS.length - 1) {
          state.level += 1;
          cache.clear();
          measure();
          want();
        }
      }
    };

    // Movimento reduzido: um quadro por mudança, sem laço
    const still = () => {
      if (state.building) {
        while (state.building) buildStep();
      }
      state.progress = progressOf(journeyStore.getState());
      draw(0, 0);
    };

    measure();
    want();
    if (reduced) still();
    else raf = requestAnimationFrame(frame);

    const unsubscribe = journeyStore.subscribe((st, prev) => {
      if (st.theme !== prev.theme || Math.round(st.seasonMix) !== Math.round(prev.seasonMix)) want();
      if (st.theme !== prev.theme) scheduleIdle();
      if (st.progress !== prev.progress) state.lastInput = state.lastScroll = performance.now();
      if (reduced && (st.theme !== prev.theme || st.progress !== prev.progress)) requestAnimationFrame(still);
    });
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cache.clear();
        measure();
        want();
        if (reduced) requestAnimationFrame(still);
      }, 200);
    };
    const onPointer = (e) => {
      state.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      state.lastInput = performance.now();
    };
    // Clique no rio (fora do conteúdo): uma onda e as carpas vêm ver
    const hit = document.createElement('canvas').getContext('2d');
    const riverShape = new Path2D(RIVER);
    const onClick = (e) => {
      if (reduced || !isSceneClick(e.target) || state.progress < 0.55) return;
      const { q } = state.view;
      const [a, ex, fy] = state.near;
      const x = (e.clientX * q - ex) / a;
      const y = (e.clientY * q - fy) / a;
      if (!hit.isPointInPath(riverShape, x, y)) return;
      ripples.push({ x, y, t: 0, big: true });
      // Posição no rio (t, u) do ponto clicado, para as carpas irem até ele
      let best = 0.6;
      for (let t = 0.5; t <= 1; t += 0.01) if (Math.abs(riverAt(RIVER_SPEC, t).y - y) < Math.abs(riverAt(RIVER_SPEC, best).y - y)) best = t;
      const r = riverAt(RIVER_SPEC, best);
      lure = { t: Math.min(0.98, Math.max(0.56, best)), u: Math.max(-0.85, Math.min(0.85, (x - r.x) / r.half)) };
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      if (idleId) cancelIdle(idleId);
      unsubscribe();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="painted-scene"
      data-painted=""
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', opacity: 0, transition: 'opacity 0.9s ease' }}
    />
  );
}
