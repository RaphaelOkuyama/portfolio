// 鯉: nado das carpas no rio do contato. Funções puras (testáveis), no plano do rio: x lateral,
// z ao longo do rio (a câmera fica do lado +z). Cada carpa: { x, z, heading, speed, ... }

// Ângulo de rumo para um vetor (0 = nadando para +z)
export const headingTo = (dx, dz) => Math.atan2(dx, dz);

// Menor diferença entre dois ângulos, em -π..π
export function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const insideZone = (x, z, { x: [x0, x1], z: [z0, z1] }) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

export function clampToZone(x, z, { x: [x0, x1], z: [z0, z1] }) {
  return { x: Math.min(x1, Math.max(x0, x)), z: Math.min(z1, Math.max(z0, z)) };
}

// Um passo de nado rumo ao alvo: vira aos poucos (taxa limitada) e desacelera ao chegar. Fora da
// zona, o alvo vira o centro dela (nunca saem da faixa visível). Devolve a carpa nova
export function swimStep(koi, target, dt, { zone, turn, slowRadius }) {
  const center = { x: (zone.x[0] + zone.x[1]) / 2, z: (zone.z[0] + zone.z[1]) / 2 };
  const goal = insideZone(koi.x, koi.z, zone) ? target : center;
  const dx = goal.x - koi.x;
  const dz = goal.z - koi.z;
  const dist = Math.hypot(dx, dz);
  const desired = headingTo(dx, dz);
  const maxTurn = turn * dt;
  const heading = koi.heading + Math.max(-maxTurn, Math.min(maxTurn, angleDelta(koi.heading, desired)));
  // Chegando: diminui até 35% (nunca para de vez, carpa sempre se mexe um pouco)
  const speed = koi.speed * (0.35 + 0.65 * Math.min(1, dist / slowRadius));
  return {
    ...koi,
    heading,
    x: koi.x + Math.sin(heading) * speed * dt,
    z: koi.z + Math.cos(heading) * speed * dt,
    // Quão rápido está nadando agora (0..1): a cauda bate mais forte
    effort: Math.min(1, speed / koi.speed),
  };
}

// Afasta carpas sobrepostas (empurrão lateral simples): devolve [dx, dz] para somar à posição
export function separation(koi, others, minDist) {
  let px = 0;
  let pz = 0;
  for (const o of others) {
    if (o === koi) continue;
    const dx = koi.x - o.x;
    const dz = koi.z - o.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.0001 && d < minDist) {
      const push = (minDist - d) / minDist;
      px += (dx / d) * push;
      pz += (dz / d) * push;
    }
  }
  return [px, pz];
}

// Lugar na roda em volta de um ponto (cursor ou lanterna): cada carpa tem seu ângulo, que gira devagar
export function orbitPoint(center, index, count, time, radius) {
  const a = (index / Math.max(1, count)) * Math.PI * 2 + time * 0.35;
  return { x: center.x + Math.sin(a) * radius, z: center.z + Math.cos(a) * radius };
}
