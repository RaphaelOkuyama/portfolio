// Chão do vale: terreno contínuo sob o caminho da câmera, do hero até a margem do rio.
// Torii, jardim zen e pedras se apoiam nele (antes o jardim era uma placa solta no ar).

// Altura no eixo do vale: pontos [z, y] ordenados de z maior (início) para menor (rio),
// interpolados com suavização para o relevo não ter quinas
export function profileHeight(z, profile) {
  if (z >= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    const [z1, y1] = profile[i];
    if (z >= z1) {
      const [z0, y0] = profile[i - 1];
      const t = (z0 - z) / (z0 - z1);
      const s = t * t * (3 - 2 * t);
      return y0 + (y1 - y0) * s;
    }
  }
  return profile[profile.length - 1][1];
}

// Fora da faixa plana do meio o chão sobe em concha até encontrar as encostas das montanhas
export function groundHeight(x, z, { profile, flatHalf, bowl, bowlMax }) {
  const side = Math.max(0, Math.abs(x) - flatHalf);
  return profileHeight(z, profile) + Math.min(bowl * side * side, bowlMax);
}
