// 無限月読: easter egg da lua. Clicar na lua (à noite, no hero) a transforma no olho de anéis com
// nove tomoe e a página inteira fica vermelha; clicar de novo (ou Esc, ou trocar o tema) desfaz.
// Estado compartilhado entre as peças da cena: `mix` sobe e desce suave (a Atmosphere escreve)
export const TSUKUYOMI = {
  // Quanto tempo o olho leva para abrir e quando o clarão vermelho cobre a tela (s)
  open: 1.6,
  flashAt: 1.15,
  // Céu, névoa, montanhas e água tingidos de vermelho
  sky: '#2a0306',
  fog: '#6a0f15',
  mountains: ['#100103', '#3a070c', '#7a1a20'],
  water: '#160204',
  // Cor do olho (íris) e da lua por trás dele
  iris: '#c8101e',
  // Quanto a lua cresce com o olho aberto
  moonScale: 2.1,
  glow: '#ff3a3a',
};

export const tsukuyomi = { mix: 0, start: -Infinity };

// Abertura do olho (0..1) a partir do início, com o tempo de TSUKUYOMI.open
export function eyeOpening(now, start, duration = TSUKUYOMI.open) {
  const t = (now - start) / duration;
  if (t <= 0) return 0;
  return t >= 1 ? 1 : 1 - (1 - t) ** 3;
}
