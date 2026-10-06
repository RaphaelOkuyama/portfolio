// 日の出 / 日の入り: a troca de tema como pôr (ou nascer) do sol. O astro atual desce atrás das
// montanhas, o céu passa pelo laranja e roxo das gravuras ukiyo-e e o outro astro sobe.
// Estado compartilhado entre a Atmosphere (que dispara e tinge o céu) e o Celestial (o sol e a lua)
export const SUNSET = {
  duration: 3.2,
  // Quanto o astro desce (em unidades da cena) para sumir atrás das cordilheiras
  drop: 30,
  // Céu no meio da transição: horizonte em laranja, alto em roxo-índigo
  horizon: '#e5793f',
  zenith: '#4a2d63',
  // Força máxima do tingido no horizonte e no alto
  amount: { horizon: 0.78, zenith: 0.62 },
  // O sol fica vermelho (日の丸) perto do horizonte
  sunLow: '#e0472a',
};

export const skyTransition = { start: -Infinity, from: null, to: null };

export function startSkyTransition(from, to, now) {
  Object.assign(skyTransition, { start: now, from, to });
}

// Fase da transição (0..1), ou null fora dela
export function transitionPhase(now, { start } = skyTransition, duration = SUNSET.duration) {
  const p = (now - start) / duration;
  return p >= 0 && p <= 1 ? p : null;
}

// Intensidade do céu de pôr do sol: sobe e desce, no auge no meio da transição
export function sunsetGlow(p) {
  return p === null ? 0 : Math.sin(Math.PI * p);
}

const ease = (t) => t * t * (3 - 2 * t);

// O astro visível e quanto ele está abaixo da posição normal (0 = no lugar, 1 = escondido):
// na primeira metade o antigo desce, na segunda o novo sobe
export function celestialAt(p, { from, to } = skyTransition) {
  if (p === null) return null;
  if (p < 0.5) return { theme: from, sink: ease(p * 2), setting: true };
  return { theme: to, sink: 1 - ease((p - 0.5) * 2), setting: false };
}
