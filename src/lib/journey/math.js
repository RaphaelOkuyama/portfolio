// Pequenas funções de interpolação usadas pela cena

export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// 1 dentro de [from, to], com rampas suaves de largura `fade` nas bordas, 0 fora
export function bandOpacity(x, from, to, fade) {
  return smoothstep(from - fade, from, x) * (1 - smoothstep(to, to + fade, x));
}

// Vaga-lumes: auge no verão (mix 1), somem até 0,7 de distância
export function summerWeight(seasonMix) {
  return Math.max(0, 1 - Math.abs(seasonMix - 1) / 0.7);
}
