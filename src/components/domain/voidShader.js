import { softwareContext } from '../../lib/webgl';
// 無量空処: o shader do Vazio Infinito (tela inteira, WebGL2). Espaço em breu com galáxias ao longe
// e manchas brancas, num zoom que não para, anéis concêntricos correndo para o centro, túnel
// de estrelas em coordenadas polares (riscam quando a velocidade sobe), um
// orbe negro no centro com anel de luz, raios e lente gravitacional dobrando o fundo em volta, e a
// abertura: um círculo que cresce a partir do gatilho com uma borda de luz. Saída pré-multiplicada

export const VERTEX = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uReveal;
uniform vec2 uOrigin;
uniform float uOrb;
uniform float uWarp;
uniform float uFlash;
uniform float uTravel;
out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
// Ruído que dá a volta: em x o reticulado repete a cada period células. Com o ângulo medido em
// voltas × period, o lado esquerdo do centro (onde o atan pula de π para -π) não vira uma costura;
// antes ali aparecia uma linha reta cortando o vazio
const float TURN = 6.28318;
float pnoise(vec2 p, float period) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, period), x1 = mod(i.x + 1.0, period);
  return mix(mix(hash21(vec2(x0, i.y)), hash21(vec2(x1, i.y)), u.x),
             mix(hash21(vec2(x0, i.y + 1.0)), hash21(vec2(x1, i.y + 1.0)), u.x), u.y);
}
float pfbm(vec2 p, float period) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * pnoise(p, period); p *= 2.0; period *= 2.0; a *= 0.5; }
  return v;
}

// Galáxia distante: mancha elíptica inclinada, com núcleo e dois braços leves
float galaxy(vec2 p, vec2 c, float size, float tilt, float squash) {
  vec2 d = p - c;
  float cs = cos(tilt), sn = sin(tilt);
  d = vec2(cs * d.x + sn * d.y, -sn * d.x + cs * d.y);
  d.y /= squash;
  float r = length(d) / size;
  float arms = 0.55 + 0.45 * sin(atan(d.y, d.x) * 2.0 - log(r + 0.05) * 5.0);
  return exp(-r * r * 3.0) * arms * 0.55 + exp(-r * r * 46.0);
}

// Espaço do 無量空処: breu de espaço sideral, um véu azul muito fraco, fumaça azulada e galáxias ao longe
// (as manchas brancas de tinta entram por cima, em main). O clarão branco que vem antes é da
// linha do tempo (uFlash), não daqui
vec3 nebula(vec2 p, float t) {
  vec2 q = vec2(fbm(p * 1.3 + t * 0.03), fbm(p * 1.3 + vec2(5.2, 1.3) - t * 0.02));
  float n = fbm(p * 1.6 + q * 2.4 + t * 0.02);
  vec3 col = vec3(0.003, 0.004, 0.014);
  col += vec3(0.03, 0.07, 0.2) * smoothstep(0.4, 0.85, n);
  col += vec3(0.16, 0.1, 0.34) * pow(smoothstep(0.7, 1.0, n), 2.0) * 0.5;
  float gal = galaxy(p, vec2(-0.82, 0.36), 0.2, 0.5, 0.38)
    + galaxy(p, vec2(0.78, -0.3), 0.15, -0.9, 0.5)
    + galaxy(p, vec2(0.52, 0.47), 0.09, 1.3, 0.32)
    + galaxy(p, vec2(-0.5, -0.44), 0.11, 2.2, 0.6);
  col += vec3(0.72, 0.8, 1.0) * gal;
  return col;
}

// Estruturas concêntricas: anéis em escala logarítmica que correm para o centro (a profundidade
// impossível: sempre há outro anel vindo), com marcas finas como uma régua de informação
vec3 rings(vec2 p, float travel, float t) {
  float r = length(p);
  float a = atan(p.y, p.x);
  float z = log(r + 0.0001) * 2.2 + travel * 0.9;
  float band = fract(z);
  float line = exp(-pow((band - 0.5) / 0.012, 2.0));
  // Tiques ao longo do anel, girando devagar em sentidos alternados
  float k = floor(z);
  float dir = mod(k, 2.0) * 2.0 - 1.0;
  float ticks = step(0.92, fract(a / 6.28318 * 72.0 + t * 0.05 * dir + k * 0.37)) * exp(-pow((band - 0.5) / 0.05, 2.0));
  float fade = smoothstep(0.12, 0.35, r) * (1.0 - smoothstep(0.9, 1.4, r));
  return vec3(0.45, 0.6, 1.0) * (line * 0.09 + ticks * 0.05) * fade;
}

vec3 tunnel(vec2 p, float t) {
  vec3 col = vec3(0.0);
  float r = length(p);
  float a = atan(p.y, p.x);
  // Riscos mais longos com a velocidade, mas sempre dentro das três células vistas (sem cortes)
  float stretch = 1.0 + min(uWarp * 3.0 * r, 2.2);
  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    float dens = 30.0 + fl * 26.0;
    float z = log(r + 0.001) * (1.6 + fl * 0.5) - t * (1.0 + fl * 0.6);
    vec2 g = vec2(a / 6.28318 * dens, z * 4.0);
    for (int k = -1; k <= 1; k++) {
      vec2 cell = floor(g) + vec2(0.0, float(k));
      vec2 f = g - cell - 0.5;
      // O ângulo dá a volta: a primeira e a última coluna são a mesma célula (sem costura)
      vec2 id = vec2(mod(cell.x, floor(dens)), cell.y);
      float h = hash21(id + fl * 31.7);
      if (h > 0.8) {
        vec2 o = (vec2(hash21(id + 1.3), hash21(id + 7.1)) - 0.5) * vec2(0.5, 0.3);
        vec2 d = f - o;
        float s = exp(-(d.x * d.x * 120.0 + d.y * d.y * 120.0 / (stretch * stretch)));
        float tw = 0.6 + 0.4 * sin(uTime * 3.0 + h * 40.0);
        vec3 c = mix(vec3(0.7, 0.86, 1.0), vec3(1.0, 0.86, 1.0), hash21(id + 3.3));
        col += c * s * tw * smoothstep(0.02, 0.3, r) * (0.85 + fl * 0.45) / sqrt(stretch);
      }
    }
  }
  return col;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - 0.5 * uRes) / uRes.y;
  float t = uTime;

  // Abertura: o vazio rasga a cena a partir do gatilho (como no anime): a borda é irregular, em
  // dentes de tinta branca, com respingos soltos logo à frente dela
  float diag = length(uRes);
  vec2 fromO = frag - uOrigin;
  float dist = length(fromO) / diag;
  float ang = atan(fromO.y, fromO.x);
  float rev = uReveal * 1.08;
  float opening = step(0.001, uReveal) * (1.0 - smoothstep(0.88, 1.0, uReveal));
  float turns = ang / TURN;
  float ragged = ((pfbm(vec2(turns * 14.0, uReveal * 3.0), 14.0) - 0.5) * 0.11 + (pnoise(vec2(turns * 138.0, 1.7), 138.0) - 0.5) * 0.03)
    * smoothstep(0.0, 0.06, rev);
  float rr = rev + ragged;
  float inside = 1.0 - smoothstep(rr - 0.003, rr, dist);
  float edge = exp(-pow((dist - rr) / 0.006, 2.0)) * opening;
  // Respingos: manchas brancas fora da borda, mais densas perto dela
  float ahead = dist - rr;
  float splat = step(0.0, ahead) * step(0.78, noise(fromO / diag * 90.0 + 7.0)) * exp(-ahead / 0.018) * opening;
  edge = max(edge, splat);

  // Lente gravitacional: perto do orbe o fundo é puxado para fora
  // O astro é enorme; em tela em pé ele encolhe para caber na largura
  float R = min(0.26, 0.4 * uRes.x / uRes.y) * uOrb;
  float r = length(p);
  vec2 lp = R > 0.0 ? p * (1.0 - (R * R * 0.9) / max(r * r, R * R)) : p;
  float rot = t * 0.04;
  mat2 m = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
  // Puxado para dentro: o fundo se aproxima sem parar (zoom contínuo)
  float pull = 1.0 / (1.0 + uTravel * 0.06);
  vec3 col = nebula(m * lp * 1.2 * pull, t);
  col += rings(lp, uTravel, t);
  col += tunnel(lp, uTravel);

  if (R > 0.0) {
    float a = atan(p.y, p.x);
    float core = 1.0 - smoothstep(R - 0.003, R, r);
    float out_ = max(r - R, 0.0);
    float ring = exp(-pow((r - R) / 0.008, 2.0));
    // Dentro do anel, a íris: fumaça em espiral caindo para a pupila negra
    float pr = R * 0.44;
    float pupil = 1.0 - smoothstep(pr - 0.004, pr, r);
    float fall = a + log(r / R + 0.05) * 4.5 + t * 0.5;
    float smoke = pfbm(vec2(fall / TURN * 6.0, r / R * 5.0 - t * 0.2), 6.0);
    vec3 irisCol = mix(vec3(0.015, 0.025, 0.06), vec3(0.3, 0.37, 0.52), smoothstep(0.32, 0.72, smoke)) * (0.2 + 0.8 * smoothstep(pr, R, r));
    // Brilho e raios só do lado de fora: o miolo fica negro
    float glow = (exp(-out_ * 11.0) * 0.6 + exp(-out_ * 2.8) * 0.2) * (1.0 - core);
    float rays = pow(pnoise(vec2(a / TURN * 88.0, t * 0.6), 88.0), 4.0) * exp(-out_ * 3.0) * 0.9 * (1.0 - core);
    // O anel quase branco, com um fio de azul-gelo
    vec3 rim = vec3(0.8, 0.93, 1.0);
    // Disco de acreção: riscos em espiral girando em volta do buraco, iridescentes (azul-gelo
    // passando por violeta e um âmbar fraco, como o vazio do anime)
    float swirl = a + log(r / R + 0.05) * 3.2 - t * 0.9;
    float sw = swirl / TURN;
    float streak = pow(pnoise(vec2(sw * 31.0, r * 38.0), 31.0), 3.0) + pow(pnoise(vec2(sw * 69.0 + 4.0, r * 90.0), 69.0), 5.0) * 0.6;
    float disk = streak * exp(-out_ * 7.5) * (1.0 - core);
    // Frequências inteiras no ângulo: a cor fecha a volta sem degrau
    vec3 iri = mix(vec3(0.55, 0.85, 1.0), vec3(0.78, 0.6, 1.0), 0.5 + 0.5 * sin(swirl));
    iri = mix(iri, vec3(1.0, 0.78, 0.55), pow(0.5 + 0.5 * sin(swirl + 2.0), 6.0) * 0.6);
    col = mix(col, vec3(0.0), core);
    col += core * (1.0 - pupil) * irisCol * uOrb;
    // O anel muda de cor em volta: dourado em cima, verde-água à direita
    vec3 ringCol = mix(rim, vec3(1.0, 0.84, 0.5), pow(max(sin(a), 0.0), 2.0) * 0.8);
    ringCol = mix(ringCol, vec3(0.5, 1.0, 0.86), pow(max(cos(a), 0.0), 3.0) * 0.6);
    col += ring * 3.0 * ringCol * ringCol * uOrb + (glow + rays) * rim * uOrb;
    col += iri * disk * 1.3 * uOrb;
    // O anel se separa em cores nas bordas (aberração)
    col.r += exp(-pow((r - R * 1.014) / 0.004, 2.0)) * 0.5 * uOrb;
    col.b += exp(-pow((r - R * 0.986) / 0.004, 2.0)) * 0.7 * uOrb;
  }

  col *= 1.0 - 0.45 * pow(length(p * vec2(0.9, 1.1)), 2.0);
  col += (hash21(frag + fract(t) * 100.0) - 0.5) * 0.03;
  col += uFlash;
  col = 1.0 - exp(-max(col, 0.0) * 1.4);
  // セル画: a luz em faixas de tom, com a passagem curta entre uma e outra, como fundo pintado de
  // anime (em degradê contínuo o vazio parecia render 3D)
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float lv = lum * 7.0;
  float cel = (floor(lv) + smoothstep(0.38, 0.62, fract(lv))) / 7.0;
  col *= lum > 0.002 ? mix(lum, cel, 0.8) / lum : 1.0;
  // 墨: manchas brancas de tinta respingada por cima do espaço e do anel, de borda seca, com
  // gotas soltas em volta e furos pretos por dentro; só a pupila fica livre
  vec2 ip = m * lp * 1.2 * pull;
  vec2 iq = vec2(fbm(ip * 0.9 + 3.1), fbm(ip * 0.9 + vec2(8.4, 2.7)));
  float blot = fbm(ip * 1.9 + iq * 1.6 + 20.0 + t * 0.015);
  float ink = smoothstep(0.512, 0.527, blot);
  float drops = smoothstep(0.62, 0.66, noise(ip * 13.0 + 4.0)) * smoothstep(0.41, 0.512, blot) * (1.0 - ink);
  float specks = smoothstep(0.68, 0.72, noise(ip * 17.0 + 9.0)) * (1.0 - smoothstep(0.527, 0.6, blot));
  ink = clamp(ink * (1.0 - specks) + drops, 0.0, 1.0) * smoothstep(R * 0.44, R * 0.5, r) * uOrb;
  col = mix(col, vec3(0.96, 0.98, 1.0), ink * 0.96);

  vec3 e = vec3(0.9, 0.96, 1.0) * edge * 1.6;
  outColor = vec4(col * inside + e, clamp(inside + edge, 0.0, 1.0));
}
`;

// Programa pronto para desenhar: devolve { draw(uniforms), dispose } ou null sem WebGL2
export function createVoid(canvas) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  // Sem GPU, o vazio em tela cheia na CPU levaria segundos por quadro: o domínio segue sem ele
  if (!gl || gl.isContextLost() || softwareContext(gl)) return null;
  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram();
  const vs = shader(gl.VERTEX_SHADER, VERTEX);
  const fs = shader(gl.FRAGMENT_SHADER, FRAGMENT);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  // Compilação em paralelo: consultar o resultado do link na hora travava a página (~300 ms logo
  // depois da tecla). Com a extensão, o driver compila em segundo plano e o vazio só começa a
  // desenhar quando o programa fica pronto (ele só aparece aos 0,8 s mesmo)
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  let state = 'pending';
  let buffer = null;
  let u = null;
  const setup = () => {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('無量空処: shader', gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(program));
      state = 'failed';
      return;
    }
    // Um triângulo que cobre a tela
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    const names = ['uRes', 'uTime', 'uReveal', 'uOrigin', 'uOrb', 'uWarp', 'uFlash', 'uTravel'];
    u = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)]));
    state = 'ready';
  };
  const ready = () => {
    if (state === 'pending' && (!parallel || gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR))) setup();
    return state === 'ready';
  };
  if (!parallel) ready();
  if (state === 'failed') return null;
  return {
    // Termina a compilação agora (bloqueia): usado na pré-compilação, quando ninguém vê a pausa
    finish() {
      if (state === 'pending') setup();
      return state === 'ready';
    },
    draw({ time, reveal, origin, orb, warp, flash, travel }) {
      if (!ready()) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uReveal, reveal);
      gl.uniform2f(u.uOrigin, origin[0], origin[1]);
      gl.uniform1f(u.uOrb, orb);
      gl.uniform1f(u.uWarp, warp);
      gl.uniform1f(u.uFlash, flash);
      gl.uniform1f(u.uTravel, travel);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

// Pré-compilação: o shader do vazio é pesado e, sem a extensão de compilação em paralelo (muitas
// GPUs e navegadores), compilar trava a página ~250 ms. Então ele é compilado antes de o domínio
// abrir, quando a pessoa começa a digitar a palavra secreta ou a segurar o kanji 技 (nada anima
// nessa hora, ninguém vê a pausa). O domínio pega o canvas já pronto com takeVoid
let prepared = null;
export function prepareVoid() {
  if (prepared || typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const v = createVoid(canvas);
  if (!v) return;
  // Força o driver a terminar todo o trabalho (link e o primeiro desenho), não só a enfileirar
  if (v.finish()) v.draw({ time: 0, reveal: 0, origin: [0, 0], orb: 0, warp: 0, flash: 0, travel: 0 });
  prepared = { canvas, v };
}

// O vazio pronto (se foi pré-compilado) ou um novo, no canvas dado
export function takeVoid(fallback) {
  if (prepared) {
    const p = prepared;
    prepared = null;
    return p;
  }
  return { canvas: fallback, v: createVoid(fallback) };
}
