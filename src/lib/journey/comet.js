// 彗星: o cometa que se parte em dois (homenagem a Kimi no Na wa). Passa de tempos em tempos pelo
// céu da noite; no meio do caminho um pedaço se solta e cai num rumo próprio. Funções puras:
// posição no plano do céu (x, y relativos à câmera) a partir do tempo

export const COMET = {
  // A cada `every` s uma passagem de `duration` s (a primeira logo depois de `first` s)
  every: 42,
  duration: 11,
  first: 9,
  // Plano do céu: distância à frente da câmera e o trajeto (de/para) em x, y desse plano
  distance: 170,
  from: [-95, 70],
  to: [80, 38],
  // Fração do trajeto em que ele se parte e o desvio do pedaço que cai (unidades por fração)
  split: 0.48,
  drift: [18, -46],
  // Comprimento da cauda e espessura
  length: 34,
  width: 5,
};

const ease = (t) => t * t * (3 - 2 * t);

// Fase da passagem atual (0..1) ou null entre passagens
export function cometPhase(time, c = COMET) {
  const t = time - c.first;
  if (t < 0) return null;
  const p = (t % c.every) / c.duration;
  return p <= 1 ? p : null;
}

// Os pedaços visíveis na fase p: [{ x, y, dx, dy, fade }] (dx, dy = direção do movimento)
export function cometPieces(p, c = COMET) {
  if (p === null) return [];
  const fade = Math.min(1, p / 0.12, (1 - p) / 0.18);
  const at = (q) => [c.from[0] + (c.to[0] - c.from[0]) * q, c.from[1] + (c.to[1] - c.from[1]) * q];
  const [x, y] = at(p);
  const dir = [c.to[0] - c.from[0], c.to[1] - c.from[1]];
  const pieces = [{ x, y, dx: dir[0], dy: dir[1], fade, size: 1 }];
  if (p > c.split) {
    // O pedaço que se solta: sai do ponto da quebra, curva para baixo e fica mais forte que o resto
    const s = ease(Math.min(1, (p - c.split) / (1 - c.split)));
    const k = p - c.split;
    const [bx, by] = at(p);
    const ox = c.drift[0] * k * s * 2;
    const oy = c.drift[1] * k * s * 2;
    pieces.push({
      x: bx + ox, y: by + oy, dx: dir[0] + c.drift[0] * s, dy: dir[1] + c.drift[1] * s,
      fade: fade * Math.min(1, k / 0.06), size: 0.8,
    });
  }
  return pieces;
}
