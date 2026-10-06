// 水玉 3D: a gota do cursor desenhada como um corpo d'água de verdade num canvas WebGL minúsculo
// (o dobro do diâmetro da gota). Raymarching de uma esfera deformável (alonga com o movimento,
// treme como gelatina) e luz de estúdio: o reflexo do ambiente (céu, chão e duas janelas de luz)
// pesado pelo Fresnel, a borda escurecida pela espessura da água e a cáustica (a luz que atravessa e
// junta embaixo). O meio fica quase transparente: ali aparece a lente que refrata a página (DOM)

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform mat2 uInv;
uniform float uJiggle;

float sdf(vec3 p) {
  vec3 q = vec3(uInv * p.xy, p.z);
  // Gelatina: ondas na superfície, mais fortes quando ela acabou de correr ou levar um tapa
  float w = sin(q.x * 3.0 + uTime * 9.0) * sin(q.y * 3.3 - uTime * 7.0) * 0.6
          + sin(q.z * 2.6 + q.x * 1.7 + uTime * 6.0) * 0.4;
  // Um pouco mais pesada embaixo (gravidade)
  q.y *= 1.0 + 0.06 * step(q.y, 0.0);
  return (length(q) - 1.0 + w * 0.025 + w * uJiggle * 0.06) * 0.7;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.003, 0.0);
  return normalize(vec3(
    sdf(p + e.xyy) - sdf(p - e.xyy),
    sdf(p + e.yxy) - sdf(p - e.yxy),
    sdf(p + e.yyx) - sdf(p - e.yyx)));
}

// Estúdio: céu claro em cima, chão escuro, uma janela grande no alto à esquerda e uma fina à direita
vec3 env(vec3 r) {
  float up = r.y * 0.5 + 0.5;
  vec3 c = mix(vec3(0.02, 0.04, 0.09), vec3(0.7, 0.85, 1.05), smoothstep(0.25, 0.95, up));
  vec2 a = vec2(r.x + 0.4, r.y - 0.5);
  // As janelas são fontes de luz: muito mais fortes que o céu (aparecem mesmo com pouco Fresnel)
  c += vec3(1.0) * smoothstep(0.4, 0.31, max(abs(a.x) * 1.1, abs(a.y) * 1.6)) * step(0.0, r.z) * 34.0;
  vec2 b = vec2(r.x - 0.72, r.y - 0.08);
  c += vec3(0.75, 0.88, 1.0) * smoothstep(0.1, 0.06, max(abs(b.x) * 2.6, abs(b.y) * 0.75)) * step(0.0, r.z) * 14.0;
  c += vec3(0.3, 0.55, 0.95) * smoothstep(0.55, 1.0, -r.y) * 0.25;
  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv * 2.0 - 1.0) * 2.0;
  vec3 ro = vec3(p, 3.0);
  vec3 rd = vec3(0.0, 0.0, -1.0);
  float t = 0.0;
  float hit = 0.0;
  for (int i = 0; i < 40; i++) {
    float d = sdf(ro + rd * t);
    if (d < 0.0008) { hit = 1.0; break; }
    t += d;
    if (t > 6.0) break;
  }
  if (hit < 0.5) { gl_FragColor = vec4(0.0); return; }

  vec3 pos = ro + rd * t;
  vec3 n = normalAt(pos);
  float ndv = clamp(n.z, 0.0, 1.0);
  float fres = 0.03 + 0.97 * pow(1.0 - ndv, 4.0);
  vec3 refl = env(reflect(rd, n));

  // Borda: a luz atravessa muita água de lado e sai azul-escura (dá a espessura)
  float rim = smoothstep(0.42, 0.04, ndv);
  vec3 rimCol = vec3(0.02, 0.1, 0.26);
  // Cáustica: a luz que entra pelo alto à esquerda e foca embaixo, à direita
  vec2 cp = pos.xy - vec2(0.3, -0.52);
  float caustic = exp(-dot(cp, cp) * 9.0) * smoothstep(0.2, 0.7, ndv);
  // Um brilho interno fraco (a água devolve um pouco de luz do céu)
  float inner = smoothstep(0.3, 1.0, ndv) * 0.05;

  vec3 spec = refl * fres;
  vec3 col = spec + vec3(0.85, 0.96, 1.0) * caustic * 0.85 + vec3(0.6, 0.8, 1.0) * inner;
  col = mix(col, rimCol, rim * 0.55);
  float alpha = clamp(fres * 0.9 + max(spec.r, spec.b) * 0.8 + caustic * 0.6 + rim * 0.5 + inner + 0.04, 0.0, 1.0);
  // Contorno antisserrilhado: some suave no último pedaço da borda
  alpha *= smoothstep(0.0, 0.06, ndv + 0.02);
  gl_FragColor = vec4(col * min(1.0, alpha + 0.4), alpha);
}
`;

// { draw({ time, inv, jiggle }), dispose } ou null sem WebGL
export function createDrop(canvas) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl || gl.isContextLost()) return null;
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram();
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  const u = Object.fromEntries(['uRes', 'uTime', 'uInv', 'uJiggle'].map((n) => [n, gl.getUniformLocation(program, n)]));
  return {
    draw({ time, inv, jiggle }) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, time);
      gl.uniformMatrix2fv(u.uInv, false, inv);
      gl.uniform1f(u.uJiggle, jiggle);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

// Inversa da forma 2D (CSS, y para baixo) já no espaço do shader (y para cima), em ordem de coluna
export function inverseShape([a, b, c, d]) {
  // Trocar o sentido do y troca o sinal dos termos fora da diagonal
  const B = -b;
  const C = -c;
  const det = a * d - B * C || 1;
  // inv = [d, -C; -B, a] / det → colunas: (d, -B), (-C, a)
  return [d / det, -B / det, -C / det, a / det];
}
