// Mapa progresso do scroll → posição na curva da câmera (fração de comprimento, 0–1).
// Linear por partes: até o momento em que a câmera atravessa o torii (`crossAt`, no começo
// do "Sobre"), ela percorre só o trecho até o portão (`toriiT`); depois, o resto do caminho.
// Assim o torii fica à mesma distância no hero em qualquer tela e é cruzado quando o "Sobre" entra.
export function cameraT(progress, { crossAt, toriiT }) {
  const p = Math.min(1, Math.max(0, progress));
  if (crossAt <= 0 || crossAt >= 1) return p;
  if (p <= crossAt) return (p / crossAt) * toriiT;
  return toriiT + ((p - crossAt) / (1 - crossAt)) * (1 - toriiT);
}

// Parâmetros do mapa a partir da faixa do "Sobre" e do comprimento da curva
export function cameraMapParams(aboutRange, curveLength, { toriiDistance, anchor }) {
  const [start, end] = aboutRange;
  return {
    crossAt: start + (end - start) * anchor,
    toriiT: Math.min(0.9, toriiDistance / curveLength),
  };
}
