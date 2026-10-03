// 風神 (Fūjin): rolar a página rápido levanta vento. A velocidade do scroll vira uma rajada
// (0–1) que as pétalas, folhas, neve e o bambuzal leem a cada frame
export const wind = { gust: 0, target: 0 };

// Velocidade do Lenis (px por frame) → alvo da rajada; rolar devagar quase não venta
export function feedScrollVelocity(velocity) {
  wind.target = Math.min(1, Math.max(0, (Math.abs(velocity) - 4) / 50));
}

// Sobe rápido com o vento e acalma devagar; devolve a rajada atual
export function stepWind(delta) {
  const rate = wind.target > wind.gust ? 6 : 1.2;
  wind.gust += (wind.target - wind.gust) * Math.min(1, delta * rate);
  // Sem scroll novo, o alvo também se acalma (o Lenis para de mandar eventos)
  wind.target *= Math.exp(-delta * 3);
  return wind.gust;
}
