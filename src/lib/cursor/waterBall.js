// 水玉: a bola d'água que vira o cursor depois do golpe da katana. Física em px, funções puras:
// o centro persegue o mouse numa mola (atrasa e passa um pouco do ponto); a forma é uma gelatina:
// estica no rumo do movimento (e afina de lado) com uma mola pouco amortecida, que balança quando
// o mouse para ou quando leva um tapa (clique). Gotas soltas caem com a gravidade

export const WATER = {
  // Diâmetro da lente (px)
  size: 46,
  follow: { k: 360, damping: 24 },
  // Mola da deformação: baixa amortecida = gelatina
  jelly: { k: 260, damping: 9 },
  stretch: { max: 0.36, per: 1 / 2800 },
  gravity: 1700,
  dropLife: 1.4,
  splashShrink: 0.84,
  burstAt: 0.5,
  life: 24,
  dripSpeed: 1100,
};

export function createBall(x, y) {
  return {
    x, y, vx: 0, vy: 0,
    // Deformação: s = alongamento (0 = redonda), angle = eixo do alongamento, e as velocidades
    s: 0, sv: 0, angle: 0,
    // Aperto do tapa (positivo achata no eixo vertical), com a própria mola
    squash: 0, squashV: 0,
    size: 1,
  };
}

// Menor diferença entre ângulos de um eixo (mod π: o eixo de 0 e o de π são o mesmo)
function axisDelta(from, to) {
  let d = (to - from) % Math.PI;
  if (d > Math.PI / 2) d -= Math.PI;
  if (d < -Math.PI / 2) d += Math.PI;
  return d;
}

export function stepBall(ball, target, dt, w = WATER) {
  const { k, damping } = w.follow;
  ball.vx += ((target.x - ball.x) * k - ball.vx * damping) * dt;
  ball.vy += ((target.y - ball.y) * k - ball.vy * damping) * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  const speed = Math.hypot(ball.vx, ball.vy);
  const goal = Math.min(w.stretch.max, speed * w.stretch.per);
  const j = w.jelly;
  ball.sv += ((goal - ball.s) * j.k - ball.sv * j.damping) * dt;
  ball.s += ball.sv * dt;
  ball.s = Math.max(-0.35, Math.min(0.8, ball.s));
  // O eixo gira para o rumo do movimento (só quando está andando de verdade)
  if (speed > 40) ball.angle += axisDelta(ball.angle, Math.atan2(ball.vy, ball.vx)) * Math.min(1, dt * 14);
  ball.squashV += (-ball.squash * j.k * 1.4 - ball.squashV * j.damping * 0.8) * dt;
  ball.squash += ball.squashV * dt;
  return ball;
}

// Tapa (clique): a gota achata e volta balançando
export function kick(ball, amount) {
  ball.squashV += amount;
  return ball;
}

// Matriz 2x2 da forma [a, b, c, d] (para CSS matrix): alonga no eixo do movimento e afina no
// outro mantendo a área; o tapa achata na vertical. Sem girar o conteúdo (o brilho fica no lugar)
export function shapeMatrix(ball) {
  const along = 1 + ball.s;
  const across = 1 / along;
  const c = Math.cos(ball.angle);
  const s = Math.sin(ball.angle);
  // R · diag(along, across) · Rᵀ
  let a = c * c * along + s * s * across;
  const b = c * s * (along - across);
  let d = s * s * along + c * c * across;
  const q = Math.max(-0.4, Math.min(0.4, ball.squash));
  a *= 1 + q * 0.6;
  d *= 1 - q;
  return [a, b, b, d];
}

// Gotas que saem da borda: velocidade radial + parte da velocidade da bola
export function spray(ball, count, { speed = 380, spread = 1, inherit = 0.35, size = [2, 4.5] } = {}, rand = Math.random) {
  const r = (WATER.size / 2) * ball.size;
  return Array.from({ length: count }, () => {
    const a = rand() * Math.PI * 2;
    const v = speed * (0.5 + rand() * spread);
    return {
      x: ball.x + Math.cos(a) * r,
      y: ball.y + Math.sin(a) * r,
      vx: Math.cos(a) * v + ball.vx * inherit,
      vy: Math.sin(a) * v + ball.vy * inherit - 140 * rand(),
      size: size[0] + rand() * (size[1] - size[0]),
      age: 0,
    };
  });
}

// Gotas que vêm de fora e se juntam no centro (a bola se formando)
export function gather(x, y, count, radius = 70, rand = Math.random) {
  return Array.from({ length: count }, () => {
    const a = rand() * Math.PI * 2;
    const r = radius * (0.7 + rand() * 0.6);
    const t = 0.35 + rand() * 0.15;
    return {
      x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
      vx: -Math.cos(a) * r / t, vy: -Math.sin(a) * r / t,
      size: 1.5 + rand() * 2.5, age: 0, life: t, gathering: true,
    };
  });
}

export function stepDrops(drops, dt, w = WATER) {
  return drops.filter((d) => {
    if (!d.gathering) d.vy += w.gravity * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.age += dt;
    return d.age < (d.life ?? w.dropLife);
  });
}

// Mapa de deslocamento da lente (RGBA, size x size): R e G guardam para onde cada pixel olha.
// Perfil de gota: o meio aumenta um pouco, a borda dobra forte para dentro (a água "vira" a
// imagem perto da beirada). Fora do círculo fica neutro (128)
export function lensMap(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let j = 0; j < size; j += 1) {
    for (let i = 0; i < size; i += 1) {
      const x = ((i + 0.5) / size) * 2 - 1;
      const y = ((j + 0.5) / size) * 2 - 1;
      const r = Math.hypot(x, y);
      let ox = 0;
      let oy = 0;
      if (r < 1) {
        const bend = 0.18 + 0.82 * r ** 3;
        ox = -x * bend * 0.5;
        oy = -y * bend * 0.5;
      }
      const o = (j * size + i) * 4;
      data[o] = Math.round(128 + ox * 255);
      data[o + 1] = Math.round(128 + oy * 255);
      data[o + 2] = 128;
      data[o + 3] = 255;
    }
  }
  return data;
}
