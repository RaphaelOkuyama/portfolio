// Lanternas de papel (灯籠流し): chama tremendo e distribuição ao longo do rio, sem three.js

// Chama de vela: soma de senos defasados, sempre entre `min` e 1
export function flicker(time, phase, min = 0.72) {
  const n = (Math.sin(time * 7.3 + phase) + Math.sin(time * 11.1 + phase * 1.7) * 0.6 + Math.sin(time * 2.9 + phase * 0.4) * 0.8) / 2.4;
  return min + (1 - min) * (0.5 + 0.5 * n);
}

// Posições iniciais em trilha: espaçadas em z; a largura acompanha a perspectiva a partir de
// `viewZ` (onde está a câmera): perto fica estreito para caber no quadro, longe abre até a margem.
// Os lados alternam: o meio da tela fica com o conteúdo, a luz aparece nas bordas
export function laneLayout(count, { laneX, laneZ, viewZ, spread = 0.6 }, rand) {
  const [z0, z1] = laneZ;
  return Array.from({ length: count }, (_, i) => {
    const jitter = (rand() - 0.5) * ((z1 - z0) / count) * 0.8;
    // Mais juntas perto da câmera, onde a correnteza é lenta (ver currentSpeed)
    const z = Math.min(z1, Math.max(z0, z1 - (z1 - z0) * ((i + 0.5) / count) ** 1.7 + jitter));
    const half = Math.min(laneX[1], Math.max(1, viewZ - z) * spread);
    const side = i % 2 === 0 ? 1 : -1;
    return { x: side * half * (0.2 + rand() * 0.8), z };
  });
}

// Correnteza lenta junto da margem da câmera e plena ao longe: as lanternas se demoram
// na faixa de água que aparece abaixo do conteúdo
export function currentSpeed(base, z, viewZ, { slow = 0.25, from = 6, to = 34 } = {}) {
  const t = Math.min(1, Math.max(0, (viewZ - z - from) / (to - from)));
  return base * (slow + (1 - slow) * t);
}

// Nome que vai no papel da lanterna: só o primeiro nome, letras (qualquer alfabeto), até 10
export const LABEL_MAX = 10;

export function lanternLabel(name) {
  const first = String(name ?? '').trim().split(/\s+/)[0] || '';
  return Array.from(first.replace(/[^\p{L}\p{M}'-]/gu, '')).slice(0, LABEL_MAX).join('');
}

// Escrita do papel: vertical (tategaki) para nomes curtos, horizontal para os longos
export function labelLayout(label) {
  const chars = Array.from(label);
  // Tategaki só para nomes curtos em kanji/kana: letras latinas empilhadas ficavam ilegíveis
  const japanese = chars.every((c) => /[぀-ヿ㐀-鿿々ー]/.test(c));
  if (japanese && chars.length <= 5) return { mode: 'vertical', chars, lines: [label] };
  // Nomes compostos: duas linhas (primeiro nome em cima) em vez de encolher a letra
  const words = label.trim().split(/\s+/);
  const lines = words.length > 1 && label.length > 9 ? [words[0], words.slice(1).join(' ')] : [label];
  return { mode: 'horizontal', chars, lines };
}
