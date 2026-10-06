// 水玉: a bola d'água que vira o cursor depois do golpe da katana. Física de corpo mole em px:
// o centro persegue o mouse numa mola (atrasa e passa um pouco do ponto) e o contorno é um anel de
// nós com raio próprio, cada um preso por mola ao raio de repouso e aos vizinhos (tensão
// superficial). A aceleração do centro empurra o lado de trás para fora (inércia), a velocidade
// estica a gota na direção do movimento e a gravidade pesa a parte de baixo. Funções puras

export const WATER = {
  nodes: 28,
  radius: 17,
  follow: { k: 420, damping: 26 },
  surface: { k: 380, damping: 13, neighbors: 220 },
  inertia: 0.018,
  stretch: { max: 0.42, per: 1 / 2400 },
  sag: 0.07,
  // Gotas: gravidade (px/s²) e quanto vivem (s)
  gravity: 1500,
  dropLife: 1.3,
  // Cada clique espirra gotas e a bola encolhe; abaixo de `burstAt` do tamanho ela estoura
  splashShrink: 0.86,
  burstAt: 0.45,
  // Some sozinha depois desse tempo (s): estoura e o pontinho de tinta volta
  life: 24,
  // Correndo acima disso (px/s) ela pinga
  dripSpeed: 950,
};

export function createBall(x, y, w = WATER) {
  return {
    x, y, vx: 0, vy: 0, ax: 0, ay: 0,
    size: 1,
    r: Array.from({ length: w.nodes }, () => 0),
    rv: Array.from({ length: w.nodes }, () => 0),
    born: 0,
  };
}

const dirOf = (i, n) => {
  const a = (i / n) * Math.PI * 2;
  return [Math.cos(a), Math.sin(a)];
};

// Um passo da física (dt em s). `grow` multiplica o raio (entrada elástica, hover sobre links)
export function stepBall(ball, target, dt, { grow = 1, time = 0 } = {}, w = WATER) {
  const { k, damping } = w.follow;
  const ax = (target.x - ball.x) * k - ball.vx * damping;
  const ay = (target.y - ball.y) * k - ball.vy * damping;
  ball.vx += ax * dt;
  ball.vy += ay * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.ax = ax;
  ball.ay = ay;

  const speed = Math.hypot(ball.vx, ball.vy);
  const heading = Math.atan2(ball.vy, ball.vx);
  const stretch = Math.min(w.stretch.max, speed * w.stretch.per);
  const rest = w.radius * ball.size * grow;
  const n = ball.r.length;
  const s = w.surface;
  const next = ball.r.slice();
  for (let i = 0; i < n; i += 1) {
    const [dx, dy] = dirOf(i, n);
    const angle = (i / n) * Math.PI * 2;
    // Alongada no rumo do movimento (e mais fina de lado), pesada embaixo, tremendo de leve
    let goal = rest * (1 + stretch * Math.cos(2 * (angle - heading)));
    goal += rest * w.sag * Math.max(0, dy);
    goal += rest * 0.025 * Math.sin(time * 7 + i * 1.7);
    const prev = ball.r[(i - 1 + n) % n];
    const after = ball.r[(i + 1) % n];
    let force = (goal - ball.r[i]) * s.k - ball.rv[i] * s.damping + (prev + after - 2 * ball.r[i]) * s.neighbors;
    // Inércia: o centro acelera para um lado, a água fica para trás (o lado oposto incha). Com
    // teto: num tranco forte do mouse a gota deforma, mas não explode
    const push = -(ax * dx + ay * dy) * w.inertia * s.k / 60;
    const cap = rest * s.k * 0.35;
    force += Math.max(-cap, Math.min(cap, push));
    ball.rv[i] += force * dt;
    next[i] = Math.min(rest * 1.9, Math.max(rest * 0.45, ball.r[i] + ball.rv[i] * dt));
  }
  ball.r = next;
  return ball;
}

// Pontos do contorno no mundo (px)
export function outline(ball) {
  const n = ball.r.length;
  return ball.r.map((r, i) => {
    const [dx, dy] = dirOf(i, n);
    return [ball.x + dx * r, ball.y + dy * r];
  });
}

// Um tapa na superfície (clique): cada nó ganha uma velocidade radial ao acaso
export function slosh(ball, amount, rand = Math.random) {
  ball.rv = ball.rv.map((v) => v + (rand() - 0.5) * amount);
  return ball;
}

// Gotas que saem do contorno: `count` gotas, velocidade base + espalhamento
export function spray(ball, count, { speed = 380, spread = 1, inherit = 0.35, size = [2, 4.5] } = {}, rand = Math.random) {
  const drops = [];
  const n = ball.r.length;
  for (let c = 0; c < count; c += 1) {
    const i = Math.floor(rand() * n);
    const [dx, dy] = dirOf(i, n);
    const v = speed * (0.5 + rand() * spread);
    drops.push({
      x: ball.x + dx * ball.r[i],
      y: ball.y + dy * ball.r[i],
      vx: dx * v + ball.vx * inherit,
      vy: dy * v + ball.vy * inherit - 120 * rand(),
      size: size[0] + rand() * (size[1] - size[0]),
      age: 0,
    });
  }
  return drops;
}

// Avança as gotas; devolve só as que ainda vivem
export function stepDrops(drops, dt, w = WATER) {
  return drops.filter((d) => {
    d.vy += w.gravity * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.age += dt;
    return d.age < w.dropLife;
  });
}
