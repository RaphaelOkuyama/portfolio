'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, ShaderMaterial, Vector2, Vector3 } from 'three';
import { journeyStore } from '../../store/journey';
import { FESTIVAL, festival } from '../../lib/festival';
import { getCameraCurve } from './useCameraMap';
import { RIVER, TAIKOBASHI } from './config';

// 花火: os fogos do festival, no céu atrás da taikobashi. Uma nuvem só de pontos somados; cada
// faísca guarda de onde saiu, a velocidade e a hora em que nasceu, e a placa de vídeo calcula a
// trajetória (arrasto do ar e gravidade). A CPU só escreve na hora do estouro. Os rastros são
// cópias da mesma faísca atrasadas no tempo. Tipos: 菊 kiku (com rastro), 牡丹 botan (pontos),
// 柳 yanagi (chorão dourado), 輪 anel, 芯入 miolo de outra cor, 千輪 senrin (vários pequenos) e
// 大トリ otori, o último: uma casca só que abre do tamanho da tela e vira dezenas de flores

const CAPACITY = 42000;

// Cada faísca é desenhada como um risco fino (o borrão de movimento de uma estrela de verdade):
// a cabeça onde ela está agora e a cauda onde estava `aTrail` segundos antes. Os rastros longos
// (kiku, yanagi, kamuro) são cópias atrasadas cujo risco emenda no da seguinte, então viram uma
// linha contínua que acompanha a curva da queda. O risco tem núcleo branco-quente de ~1 px e um
// halo curto da cor da estrela
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform vec2 uViewport;
  attribute vec3 aVelocity;
  attribute vec2 aBirth;   // nascimento (s), vida (s)
  attribute vec3 aColor;
  attribute vec3 aColor2;
  attribute vec4 aParams;  // arrasto, gravidade, espessura, atraso do rastro
  attribute vec2 aExtra;   // força da luz, cintilar (0 = não; senão a semente)
  attribute float aTrail;  // comprimento do risco (s)
  varying vec3 vColor;
  varying vec2 vHead;
  varying vec2 vTail;
  varying float vWidth;
  varying float vSize;
  vec3 at(float age) {
    float k = aParams.x;
    float e = (1.0 - exp(-k * age)) / k;
    return position + aVelocity * e + vec3(0.0, -aParams.y, 0.0) * (age - e) / k;
  }
  void hide() {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec3(0.0);
  }
  void main() {
    float age = uTime - aBirth.x - aParams.w;
    float life = aBirth.y;
    if (age < 0.0 || age > life) { hide(); return; }
    float t = age / life;
    float fade = 1.0 - smoothstep(0.45, 1.0, t);
    // Cintilar no fim da vida (as pontas piscando antes de apagar)
    float tw = aExtra.y > 0.0 ? mix(1.0, step(0.45, fract(sin(aExtra.y * 91.7 + floor(uTime * 22.0) * 7.31) * 43758.5)) * 1.7, smoothstep(0.35, 0.6, t)) : 1.0;
    vColor = mix(aColor, aColor2, smoothstep(0.1, 0.65, t)) * fade * aExtra.x * tw;

    mat4 mvp = projectionMatrix * modelViewMatrix;
    vec4 h = mvp * vec4(at(age), 1.0);
    if (h.w <= 0.1) { hide(); return; }
    vec4 c = mvp * vec4(at(max(age - aTrail, 0.0)), 1.0);
    vec2 hv = 0.5 * uViewport;
    vec2 hs = h.xy / h.w * hv;
    vec2 ts = c.w > 0.1 ? c.xy / c.w * hv : hs;
    vec2 d = ts - hs;
    float len = length(d);
    if (len > 260.0) ts = hs + d * (260.0 / len);
    // Espessura em pixels: fina como uma estrela, só o clarão é largo
    vWidth = clamp(aParams.z * uScale / h.w * 0.22, 0.65, 60.0);
    vec2 mid = 0.5 * (hs + ts);
    vSize = min(length(ts - hs) + vWidth * 7.0 + 2.0, 600.0);
    vHead = hs - mid;
    vTail = ts - mid;
    gl_PointSize = vSize;
    gl_Position = vec4(mid / hv * h.w, h.z, h.w);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying vec2 vHead;
  varying vec2 vTail;
  varying float vWidth;
  varying float vSize;
  void main() {
    vec2 p = (gl_PointCoord - 0.5) * vSize;
    p.y = -p.y;
    vec2 ab = vTail - vHead;
    float k = clamp(dot(p - vHead, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
    float dist = length(p - vHead - ab * k);
    float w = vWidth;
    // Núcleo fino, halo curto e a cauda apagando para trás
    float core = exp(-dist * dist / (w * w * 0.6));
    float halo = exp(-dist / (w * 1.6)) * 0.22;
    float along = 1.0 - k * 0.8;
    float body = (core + halo) * along;
    if (body < 0.004) discard;
    float hot = core * (1.0 - k) * 0.55;
    vec3 col = vColor * body + vec3(1.0, 0.96, 0.88) * hot * dot(vColor, vec3(0.3333));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

// Cores: [começo, fim] de cada faísca
const PALETTE = [
  ['#ffe2a0', '#ff7a2e'], ['#ffa3bd', '#ff2e63'], ['#b4ecff', '#3f8cff'], ['#d2ffbd', '#3fd67a'],
  ['#ecd0ff', '#9a5cff'], ['#fff6dc', '#ffcf70'], ['#ff7a6a', '#ffd27a'], ['#9ffff0', '#ff8ad0'],
];
const GOLD = ['#ffe9b0', '#ff9a3c'];
const DETAIL = { high: 1, medium: 0.8, low: 0.55 };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export default function Fireworks() {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const add = (name, size) => {
      const attr = new BufferAttribute(new Float32Array(CAPACITY * size), size);
      attr.setUsage(DynamicDrawUsage);
      g.setAttribute(name, attr);
      return attr;
    };
    add('position', 3);
    add('aVelocity', 3);
    // Tudo nasce "morto" (vida 0)
    add('aBirth', 2);
    add('aColor', 3);
    add('aColor2', 3);
    add('aParams', 4);
    add('aExtra', 2);
    add('aTrail', 1);
    return g;
  }, []);
  const material = useMemo(() => new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 1000 }, uViewport: { value: new Vector2(1, 1) } },
  }), []);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  const meshRef = useRef(null);
  const sim = useMemo(() => {
    const end = getCameraCurve().getPointAt(1);
    return {
      clock: 0, cursor: 0, dirty: 0, lastEmit: -100, pending: [], niagara: null,
      water: end.y - RIVER.drop,
      c1: new Color(), c2: new Color(),
      fwd: new Vector3(), right: new Vector3(), up: new Vector3(),
    };
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const journey = journeyStore.getState();
    // Câmera lenta quando o show pede (festival.speed < 1): o relógio das faíscas anda menos
    const dt = Math.min(delta, 1 / 20) * festival.speed;
    sim.clock += dt;
    festival.clock = sim.clock;
    const now = sim.clock;
    const attrs = geometry.attributes;
    const detail = DETAIL[journey.quality] ?? 0.8;

    // Uma faísca (e os rastros dela) no próximo lugar livre da nuvem; as mais antigas são sobrescritas
    const spark = (x, y, z, vx, vy, vz, life, colors, o) => {
      const { drag = 1.8, grav = 2.2, size = 0.5, ghosts = 1, lag = 0.035, gain = 2.2, twinkle = false, delay = 0, streak = 0.07 } = o;
      sim.c1.set(colors[0]);
      sim.c2.set(colors[1]);
      for (let j = 0; j < ghosts; j += 1) {
        const i = sim.cursor;
        sim.cursor = (sim.cursor + 1) % CAPACITY;
        const f = 1 - j / ghosts;
        attrs.position.setXYZ(i, x, y, z);
        attrs.aVelocity.setXYZ(i, vx, vy, vz);
        attrs.aBirth.setXY(i, now + delay, life);
        attrs.aColor.setXYZ(i, sim.c1.r, sim.c1.g, sim.c1.b);
        attrs.aColor2.setXYZ(i, sim.c2.r, sim.c2.g, sim.c2.b);
        attrs.aParams.setXYZW(i, drag, grav, size * (0.55 + 0.45 * f), j * lag);
        attrs.aExtra.setXY(i, gain * f * f, twinkle ? 1 + Math.random() * 50 : 0);
        // Com cópias atrasadas, o risco de cada uma emenda no da próxima (linha contínua)
        attrs.aTrail.setX(i, ghosts > 1 ? lag * 1.15 : streak);
      }
      sim.dirty += ghosts;
    };
    // Direção ao acaso na esfera
    const dir = [0, 0, 0];
    const onSphere = () => {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      dir[0] = s * Math.cos(a);
      dir[1] = u;
      dir[2] = s * Math.sin(a);
    };
    const ball = (b, count, speed, life, colors, o, jitter = 0.12) => {
      const n = Math.round(count * detail);
      for (let i = 0; i < n; i += 1) {
        onSphere();
        const v = speed * (1 - jitter + Math.random() * jitter * 2);
        spark(b.x, b.y, b.z, dir[0] * v, dir[1] * v, dir[2] * v, life * rand(0.85, 1.1), colors, o);
      }
    };
    // Esfera achatada na profundidade (vira um disco de frente para quem assiste)
    const ball2 = (b, count, speed, life, colors, o, jitter, flat) => {
      const n = Math.round(count * detail);
      for (let i = 0; i < n; i += 1) {
        onSphere();
        const v = speed * (1 - jitter + Math.random() * jitter * 2);
        spark(b.x, b.y, b.z, dir[0] * v, dir[1] * v, dir[2] * v * flat, life * rand(0.9, 1.08), colors, o);
      }
    };
    // Clarão do estouro: acende o ar em volta e vai para o reflexo do rio
    const flash = (b, colors, power) => {
      spark(b.x, b.y, b.z, 0, 0, 0, 0.1 + power * 0.03, ['#fff8ea', colors[0]], { drag: 1, grav: 0, size: 2.4 * power, gain: 0.32, streak: 0 });
      sim.c1.set(colors[0]);
      festival.glows.push({ x: b.x, y: b.y - sim.water, z: b.z, color: [sim.c1.r, sim.c1.g, sim.c1.b], born: now, life: 1.5 + power * 0.5, power });
      if (festival.glows.length > 12) festival.glows.shift();
    };

    const explode = (b) => {
      const s = b.big ? 1.3 : 1;
      const c = b.colors;
      const other = pick(PALETTE);
      if (b.kind === 'botan') {
        ball(b, 170 * s, 12 * s, 1.5, c, { drag: 1.9, grav: 1.6, size: 0.62, twinkle: true });
      } else if (b.kind === 'yanagi') {
        ball(b, 120 * s, 12.5 * s, 3.6, GOLD, { drag: 1.05, grav: 4.6, size: 0.42, ghosts: 12, lag: 0.06, gain: 1.9, twinkle: true }, 0.2);
      } else if (b.kind === 'ring') {
        // Anel inclinado ao acaso, com um miolo de outra cor
        const tilt = rand(-0.9, 0.9);
        const yaw = rand(0, Math.PI);
        const n = Math.round(84 * s * detail);
        for (let i = 0; i < n; i += 1) {
          const a = (i / n) * Math.PI * 2;
          const rx = Math.cos(a);
          const ry = Math.sin(a) * Math.cos(tilt);
          const rz = Math.sin(a) * Math.sin(tilt);
          const v = 13.5 * s;
          spark(b.x, b.y, b.z, (rx * Math.cos(yaw) - rz * Math.sin(yaw)) * v, ry * v, (rx * Math.sin(yaw) + rz * Math.cos(yaw)) * v, 1.9, c, { drag: 1.8, grav: 1.4, size: 0.56, ghosts: 5 });
        }
        ball(b, 60 * s, 5.5 * s, 1.3, other, { drag: 2, grav: 1.2, size: 0.5 });
      } else if (b.kind === 'double') {
        ball(b, 150 * s, 15.5 * s, 2.1, c, { drag: 1.85, grav: 2, size: 0.5, ghosts: 6 });
        ball(b, 90 * s, 8 * s, 1.6, other, { drag: 1.9, grav: 1.6, size: 0.58, twinkle: true });
      } else if (b.kind === 'senrin') {
        // 千輪: um estouro apagado que abre vários pequenos, um depois do outro
        ball(b, 40, 7, 0.7, GOLD, { drag: 2, grav: 1, size: 0.3, gain: 1.2 });
        const n = Math.round(11 * s);
        for (let i = 0; i < n; i += 1) {
          onSphere();
          const r = rand(3, 8.5) * s;
          sim.pending.push({ at: now + rand(0.35, 1.0), x: b.x + dir[0] * r, y: b.y + dir[1] * r, z: b.z + dir[2] * r * 0.5, kind: 'mini', colors: pick(PALETTE), quiet: i % 3 !== 0 });
        }
      } else if (b.kind === 'mini') {
        ball(b, 38, 5, 1.0, c, { drag: 2.2, grav: 1.4, size: 0.46, twinkle: true });
      } else if (b.kind === 'child') {
        ball(b, 64, 7.5, 1.5, c, { drag: 2, grav: 1.8, size: 0.48, ghosts: 4, twinkle: true });
      } else if (b.kind === 'giant') {
        // 四尺玉: a casca gigante. Abre uma esfera enorme e cada ponta dela vira outro fogo
        ball(b, 250, 30, 2.6, c, { drag: 1.8, grav: 1.8, size: 0.6, ghosts: 8, lag: 0.03 }, 0.05);
        ball(b, 130, 15, 2.2, other, { drag: 1.8, grav: 1.6, size: 0.62, twinkle: true });
        const n = Math.round(34 * Math.max(0.7, detail));
        for (let i = 0; i < n; i += 1) {
          onSphere();
          const r = rand(11.5, 14.5);
          sim.pending.push({ at: now + rand(0.95, 1.5), x: b.x + dir[0] * r, y: b.y + dir[1] * r - 0.6, z: b.z + dir[2] * r * 0.4, kind: 'child', colors: pick(PALETTE), quiet: i % 4 !== 0 });
        }
      } else if (b.kind === 'kamuro') {
        // 冠菊: a coroa dourada que desce até quase a água, as pontas piscando
        ball(b, 190 * s, 17 * s, 4.4, ['#fff0c4', '#ffae4a'], { drag: 1.0, grav: 4.2, size: 0.44, ghosts: 14, lag: 0.055, gain: 1.9, twinkle: true }, 0.16);
      } else if (b.kind === 'heart') {
        // 型物: um coração, de frente para quem assiste
        const n = Math.round(96 * detail);
        for (let i = 0; i < n; i += 1) {
          const a = (i / n) * Math.PI * 2;
          const hx = 16 * Math.sin(a) ** 3;
          const hy = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
          spark(b.x, b.y, b.z, hx * 0.82 * s, hy * 0.82 * s, 0, 2.0, ['#ffb0c4', '#ff2e63'], { drag: 1.8, grav: 0.9, size: 0.6, ghosts: 3, twinkle: true });
        }
      } else if (b.kind === 'hana') {
        // As flores do otori: menores que ele, mas grandes o bastante para emendar uma na outra
        ball(b, 72, 12, 1.9, c, { drag: 2, grav: 1.5, size: 0.62, ghosts: 3, lag: 0.04, twinkle: true });
      } else if (b.kind === 'otori') {
        // 大トリ: a esfera cobre a tela inteira (achatada de frente para a câmera, vira um disco do
        // tamanho do céu visível); depois cada pedaço vira uma flor, numa onda do centro para as
        // bordas, até as flores cobrirem a tela de novo
        const { R, halfW, halfH, right, up } = b.frame;
        ball2(b, 1000, R * 1.55, 3.4, ['#ffffff', '#ffc86a'], { drag: 1.55, grav: 0.9, size: 1.05, ghosts: 7, lag: 0.035, gain: 2.4, twinkle: true }, 0.07, 0.3);
        ball2(b, 380, R * 0.85, 2.8, ['#ffd0e0', '#ff3e7a'], { drag: 1.6, grav: 0.8, size: 0.9, ghosts: 4, gain: 2 }, 0.1, 0.3);
        const total = 84 * detail;
        const cols = Math.max(5, Math.round(Math.sqrt(total * (halfW / halfH))));
        const rows = Math.max(4, Math.round(total / cols));
        for (let i = 0; i < cols; i += 1) {
          for (let j = 0; j < rows; j += 1) {
            const px = (((i + 0.5 + rand(-0.35, 0.35)) / cols) * 2 - 1) * halfW;
            const py = (((j + 0.5 + rand(-0.35, 0.35)) / rows) * 2 - 1) * halfH;
            const d = Math.min(1, Math.hypot(px, py) / R);
            sim.pending.push({
              at: now + 1.05 + d * 1.3 + rand(0, 0.25),
              x: b.x + right.x * px + up.x * py,
              y: b.y + right.y * px + up.y * py,
              z: b.z + right.z * px + up.z * py + rand(-3, 3),
              kind: 'hana', colors: pick(PALETTE), quiet: (i + j) % 5 !== 0,
            });
          }
        }
      } else {
        // 菊 kiku: a esfera com rastros, a ponta mudando de cor
        ball(b, 165 * s, 15.5 * s, 2.2, c, { drag: 1.85, grav: 2.2, size: 0.5, ghosts: 7 });
        if (b.big) ball(b, 70, 21, 2.5, GOLD, { drag: 1.9, grav: 2.6, size: 0.4, ghosts: 5, twinkle: true });
      }
      const small = b.kind === 'mini' || b.kind === 'child' || b.kind === 'hana';
      flash(b, c, small ? 0.45 : b.kind === 'otori' ? 4 : b.kind === 'giant' ? 2 : b.big ? 1.25 : 0.9);
      if (!b.quiet) festival.onBurst?.(small ? 'crackle' : b.kind === 'otori' ? 'otori' : b.kind === 'giant' ? 'giant' : b.big ? 'big' : 'small');
    };

    // Pedidos do jogo: a casca sobe da água atrás da ponte até o ponto do estouro
    const { camera } = state;
    const zone = FESTIVAL.zone;
    while (festival.queue.length) {
      const req = festival.queue.shift();
      if (req.kind === 'niagara') {
        sim.niagara = { until: now + req.seconds * festival.speed, carry: 0 };
        continue;
      }
      if (req.kind === 'otori') {
        // Bem no meio do que a câmera vê, na distância dos fogos; guarda o tamanho da tela lá
        camera.getWorldDirection(sim.fwd);
        sim.right.crossVectors(sim.fwd, camera.up).normalize();
        sim.up.crossVectors(sim.right, sim.fwd).normalize();
        const D = Math.abs((zone.z[0] + zone.z[1]) / 2 - camera.position.z) / Math.max(0.3, -sim.fwd.z);
        const halfH = Math.tan((camera.fov * Math.PI) / 360) * D;
        const halfW = halfH * camera.aspect;
        const x = camera.position.x + sim.fwd.x * D;
        const y = camera.position.y + sim.fwd.y * D;
        const z = camera.position.z + sim.fwd.z * D;
        const T = req.rise ?? 4;
        const oy = sim.water + 0.2;
        const k = 0.7;
        const e = (1 - Math.exp(-k * T)) / k;
        // A bolinha: uma cabeça grande e brilhante com um rastro longo
        spark(x, oy, z, 0, (y - oy) / e, 0, T, ['#fff4d8', '#ffb45a'], { drag: k, grav: 0, size: 1.5, ghosts: 34, lag: 0.03, gain: 2.6 });
        sim.pending.push({ at: now + T, x, y, z, kind: 'otori', colors: ['#ffffff', '#ffc86a'], frame: { R: Math.hypot(halfW, halfH) * 1.05, halfW, halfH, right: sim.right.clone(), up: sim.up.clone() } });
        continue;
      }
      const z = rand(zone.z[0], zone.z[1]);
      const dist = Math.abs(z - FESTIVAL.camera.position[2]);
      const halfW = Math.min(zone.halfX, Math.tan((camera.fov * Math.PI) / 360) * camera.aspect * dist * 0.8);
      const x = (req.x ?? rand(-1, 1)) * halfW;
      const big = Boolean(req.big || req.finale);
      // `y`: altura pedida, de 0 (baixo) a 1 (alto) dentro da faixa do céu
      const y = sim.water + (req.y === undefined ? rand(zone.y[0] + (big ? 2.5 : 0), zone.y[1] - (big ? 0 : 3)) : zone.y[0] + (zone.y[1] - zone.y[0]) * req.y);
      const kind = req.kind ?? (req.finale ? pick(['yanagi', 'senrin', 'kiku', 'double', 'kiku']) : req.big ? pick(['kiku', 'ring', 'double', 'kiku']) : pick(['botan', 'kiku', 'botan']));
      const T = req.rise ?? (req.finale ? FESTIVAL.rise.finale : FESTIVAL.rise.hit);
      const ox = x * 0.45;
      const oy = sim.water + 0.2;
      const k = 0.7;
      const e = (1 - Math.exp(-k * T)) / k;
      // Rastro dourado da subida (some um pouco antes do estouro)
      spark(ox, oy, z, (x - ox) / e, (y - oy) / e, 0, T, ['#ffe6b0', '#ff9a4a'], { drag: k, grav: 0, size: 0.45, ghosts: 14, lag: 0.022, gain: 1.5 });
      sim.pending.push({ at: now + T, x, y, z, kind, big, colors: kind === 'yanagi' ? GOLD : PALETTE[req.color] ?? pick(PALETTE) });
    }
    for (let i = sim.pending.length - 1; i >= 0; i -= 1) {
      if (sim.pending[i].at > now) continue;
      const [b] = sim.pending.splice(i, 1);
      explode(b);
    }

    // ナイアガラ: faíscas caindo do tabuleiro da ponte, do lado de quem assiste
    if (sim.niagara) {
      if (now > sim.niagara.until) sim.niagara = null;
      else {
        sim.niagara.carry += dt * 420 * detail;
        const half = TAIKOBASHI.span / 2 - 1.5;
        while (sim.niagara.carry >= 1) {
          sim.niagara.carry -= 1;
          const x = rand(-half, half);
          const y = sim.water - 0.1 + TAIKOBASHI.rise * (1 - (x / (TAIKOBASHI.span / 2)) ** 2) - 0.25;
          spark(x, y, TAIKOBASHI.z + TAIKOBASHI.width / 2 + 0.15, rand(-0.5, 0.5), rand(-1.2, 0.4), rand(0, 0.6), rand(1.2, 1.9), ['#fff4d8', '#ffb45a'], { drag: 0.9, grav: 7.5, size: 0.16, ghosts: 3, lag: 0.05, gain: 1.5, twinkle: true });
        }
      }
    }

    // Clarões vencidos saem da lista do reflexo
    for (let i = festival.glows.length - 1; i >= 0; i -= 1) {
      if (now - festival.glows[i].born > festival.glows[i].life) festival.glows.splice(i, 1);
    }

    if (sim.dirty) {
      sim.lastEmit = now;
      // Só o trecho escrito sobe para a placa (a nuvem inteira, se deu a volta)
      const from = (sim.cursor - sim.dirty + CAPACITY * 4) % CAPACITY;
      const whole = sim.dirty >= CAPACITY || from + sim.dirty > CAPACITY;
      Object.values(attrs).forEach((attr) => {
        if (!whole) attr.addUpdateRange(from * attr.itemSize, sim.dirty * attr.itemSize);
        attr.needsUpdate = true;
      });
      sim.dirty = 0;
    }

    // Fora do festival (e depois da última faísca apagar) a nuvem nem é desenhada
    const alive = now - sim.lastEmit < 5;
    mesh.visible = alive;
    if (!alive) return;
    material.uniforms.uTime.value = now;
    material.uniforms.uScale.value = state.gl.domElement.height / (2 * Math.tan((camera.fov * Math.PI) / 360));
    state.gl.getDrawingBufferSize(material.uniforms.uViewport.value);
    state.invalidate();
  });

  return <points ref={meshRef} geometry={geometry} material={material} visible={false} frustumCulled={false} renderOrder={4} />;
}
