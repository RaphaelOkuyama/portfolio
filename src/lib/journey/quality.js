// Qualidade gráfica da cena 3D: começa sempre no mínimo e a pessoa sobe se quiser (fica salvo).
// Mínimo: leve, para qualquer celular ou notebook. Médio: mais partículas, árvores e nitidez.
// Alto: tudo isso mais o brilho (bloom) e a resolução máxima
export const QUALITY_LEVELS = ['low', 'medium', 'high'];
export const DEFAULT_QUALITY = 'low';
export const QUALITY_KEY = 'oku-quality';

export const QUALITY_SETTINGS = {
  low: { dpr: 1, particles: 300, postprocessing: false, antialias: false },
  medium: { dpr: [1, 1.25], particles: 800, postprocessing: false, antialias: true },
  // Com o bloom a cena é desenhada numa textura antes da tela, sem antialias no canvas (pagaria a
  // conta sem efeito). Também sem multisampling no EffectComposer: no Chrome (ANGLE/D3D11) o MSAA
  // na textura HalfFloat junto com o mipmapBlur do bloom apagava a tela inteira perto do rio, e
  // ainda custava caro. A resolução até 1,5x já suaviza as bordas
  high: { dpr: [1, 1.5], particles: 1500, postprocessing: true, antialias: false, multisampling: 0 },
};

export function isQuality(value) {
  return QUALITY_LEVELS.includes(value);
}

// Escolha salva, ou o mínimo (storage bloqueado ou valor antigo/inválido)
export function readQuality(storage) {
  try {
    const saved = storage?.getItem(QUALITY_KEY);
    return isQuality(saved) ? saved : DEFAULT_QUALITY;
  } catch {
    return DEFAULT_QUALITY;
  }
}

export function saveQuality(storage, quality) {
  try {
    storage?.setItem(QUALITY_KEY, quality);
  } catch {
    // Storage bloqueado: a escolha vale só nesta visita
  }
}

// Um degrau abaixo (o FPS caiu); o mínimo fica no mínimo
export function stepDown(quality) {
  const i = QUALITY_LEVELS.indexOf(quality);
  return QUALITY_LEVELS[Math.max(0, i - 1)] ?? DEFAULT_QUALITY;
}
