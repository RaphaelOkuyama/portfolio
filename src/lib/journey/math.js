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

// Momiji: auge no outono (mix 2), somem até 0,8 de distância
export function autumnWeight(seasonMix) {
  return Math.max(0, 1 - Math.abs(seasonMix - 2) / 0.8);
}

// Neve: começa no fim do outono e fica cheia no inverno (mix 3)
export function winterWeight(seasonMix) {
  return smoothstep(2.3, 2.8, seasonMix);
}

// Mesma curva do ease "power2.inOut" do GSAP
export function power2InOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
