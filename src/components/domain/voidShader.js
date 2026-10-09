// 無量空処: o shader do Vazio Infinito (tela inteira, WebGL2). Nebulosa azul-violeta com o domínio
// dobrado (fbm sobre fbm) e um zoom que não para, anéis concêntricos correndo para o centro, túnel
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
uniform float uEyeOpen;
uniform vec2 uLook;
uniform float uLid;
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

// Espaço azul-violeta do 無量空処: fundo quase preto, véus índigo e violeta, filetes de ciano
vec3 nebula(vec2 p, float t) {
  vec2 q = vec2(fbm(p * 1.3 + t * 0.03), fbm(p * 1.3 + vec2(5.2, 1.3) - t * 0.02));
  float n = fbm(p * 1.6 + q * 2.4 + t * 0.02);
  vec3 col = mix(vec3(0.003, 0.004, 0.018), vec3(0.05, 0.06, 0.24), smoothstep(0.28, 0.72, n));
  col = mix(col, vec3(0.22, 0.12, 0.5), smoothstep(0.56, 0.86, n) * 0.7);
  col += vec3(0.08, 0.45, 0.95) * pow(smoothstep(0.55, 0.95, q.x * n * 1.7), 2.0) * 0.5;
  col += vec3(0.7, 0.55, 1.0) * pow(smoothstep(0.78, 1.0, n), 3.0) * 0.22;
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
  return vec3(0.45, 0.6, 1.0) * (line * 0.22 + ticks * 0.12) * fade;
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
        col += c * s * tw * smoothstep(0.02, 0.3, r) * (0.5 + fl * 0.3) / sqrt(stretch);
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
  float ragged = ((fbm(vec2(ang * 2.2, uReveal * 3.0)) - 0.5) * 0.11 + (noise(vec2(ang * 22.0, 1.7)) - 0.5) * 0.03)
    * smoothstep(0.0, 0.06, rev);
  float rr = rev + ragged;
  float inside = 1.0 - smoothstep(rr - 0.003, rr, dist);
  float edge = exp(-pow((dist - rr) / 0.006, 2.0)) * opening;
  // Respingos: manchas brancas fora da borda, mais densas perto dela
  float ahead = dist - rr;
  float splat = step(0.0, ahead) * step(0.78, noise(fromO / diag * 90.0 + 7.0)) * exp(-ahead / 0.018) * opening;
  edge = max(edge, splat);

  // Lente gravitacional: perto do orbe o fundo é puxado para fora
  float R = 0.2 * uOrb;
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
    float ring = exp(-pow((r - R) / 0.003, 2.0));
    // Brilho e raios só do lado de fora: o miolo fica negro
    float glow = (exp(-out_ * 11.0) * 0.55 + exp(-out_ * 2.6) * 0.14) * (1.0 - core);
    float rays = pow(noise(vec2(a * 14.0, t * 0.6)), 4.0) * exp(-out_ * 3.6) * 0.8 * (1.0 - core);
    // 六眼: o anel em azul-gelo, a cor do olhar do Gojo
    vec3 rim = vec3(0.62, 0.88, 1.0);
    // Disco de acreção: riscos em espiral girando em volta do buraco, iridescentes (azul-gelo
    // passando por violeta e um âmbar fraco, como o vazio do anime)
    float swirl = a + log(r / R + 0.05) * 3.2 - t * 0.9;
    float streak = pow(noise(vec2(swirl * 5.0, r * 38.0)), 3.0) + pow(noise(vec2(swirl * 11.0 + 4.0, r * 90.0)), 5.0) * 0.6;
    float disk = streak * exp(-out_ * 7.5) * (1.0 - core);
    vec3 iri = mix(vec3(0.55, 0.85, 1.0), vec3(0.78, 0.6, 1.0), 0.5 + 0.5 * sin(swirl * 1.3));
    iri = mix(iri, vec3(1.0, 0.78, 0.55), pow(0.5 + 0.5 * sin(swirl * 0.7 + 2.0), 6.0) * 0.6);
    col = mix(col, vec3(0.0), core);
    col += core * vec3(0.02, 0.05, 0.16) * smoothstep(R * 0.5, R, r);
    col += (ring * 2.4 + glow + rays) * rim * uOrb;
    col += iri * disk * 1.3 * uOrb;

    // 六眼: por um instante o buraco vira o olho do Gojo, azul, olhando para onde está o mouse e
    // piscando uma vez (as pálpebras fecham na horizontal, em amêndoa)
    if (uEyeOpen > 0.001) {
      vec2 e = p - uLook * R * 0.3;
      float er = length(e);
      float irisR = R * 0.64;
      float ea = atan(e.y, e.x);
      float fibers = pow(noise(vec2(ea * 26.0, er / irisR * 3.0 - t * 0.3)), 2.0);
      vec3 eyeCol = mix(vec3(0.75, 0.96, 1.0), vec3(0.14, 0.52, 0.95), smoothstep(0.2, 1.0, er / irisR));
      eyeCol *= 0.75 + fibers * 0.6;
      eyeCol = mix(eyeCol, vec3(0.02, 0.08, 0.22), smoothstep(0.84, 1.0, er / irisR));
      float pupil = 1.0 - smoothstep(irisR * 0.3, irisR * 0.33, er);
      eyeCol = mix(eyeCol, vec3(0.0), pupil);
      // Brilho úmido no canto de cima
      eyeCol += vec3(1.0) * (1.0 - smoothstep(0.0, irisR * 0.12, length(e - vec2(-0.32, 0.36) * irisR))) * 0.9;
      float irisMask = 1.0 - smoothstep(irisR - 0.003, irisR, er);
      // Pálpebras: só aparece o que está entre as duas curvas (abertas = 1 - uLid)
      float open = R * 0.78 * (1.0 - uLid) * (1.0 - pow(abs(p.x) / R, 2.0));
      float lids = 1.0 - smoothstep(open - 0.004, open, abs(p.y));
      // O contorno das pálpebras brilha em azul
      float lidLine = exp(-pow((abs(p.y) - open) / 0.004, 2.0)) * step(abs(p.x), R * 0.98) * (1.0 - uLid * 0.5);
      col = mix(col, eyeCol, irisMask * lids * core * uEyeOpen);
      col += vec3(0.55, 0.85, 1.0) * lidLine * core * uEyeOpen * 1.2;
      // Halo azul em volta enquanto o olho está aberto
      col += vec3(0.3, 0.6, 1.0) * glow * uEyeOpen * 0.8;
    }
    // O anel se separa em cores nas bordas (aberração)
    col.r += exp(-pow((r - R * 1.014) / 0.004, 2.0)) * 0.5 * uOrb;
    col.b += exp(-pow((r - R * 0.986) / 0.004, 2.0)) * 0.7 * uOrb;
  }

  col *= 1.0 - 0.45 * pow(length(p * vec2(0.9, 1.1)), 2.0);
  col += (hash21(frag + fract(t) * 100.0) - 0.5) * 0.03;
  col += uFlash;
  col = 1.0 - exp(-max(col, 0.0) * 1.4);

  vec3 e = vec3(0.9, 0.96, 1.0) * edge * 1.6;
  outColor = vec4(col * inside + e, clamp(inside + edge, 0.0, 1.0));
}
`;

// Programa pronto para desenhar: devolve { draw(uniforms), dispose } ou null sem WebGL2
export function createVoid(canvas) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl || gl.isContextLost()) return null;
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
    const names = ['uRes', 'uTime', 'uReveal', 'uOrigin', 'uOrb', 'uWarp', 'uFlash', 'uTravel', 'uEyeOpen', 'uLook', 'uLid'];
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
    draw({ time, reveal, origin, orb, warp, flash, travel, eye = 0, look = [0, 0], lid = 0 }) {
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
      gl.uniform1f(u.uEyeOpen, eye);
      gl.uniform2f(u.uLook, look[0], look[1]);
      gl.uniform1f(u.uLid, lid);
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
