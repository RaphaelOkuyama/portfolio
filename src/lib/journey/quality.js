// Qualidade gráfica da cena 3D: escolhida automaticamente pela placa de vídeo (autoQuality) e
// ajustável pela pessoa no seletor (a escolha fica salva e passa a valer no lugar da automática).
// Mínimo: leve, para qualquer celular ou notebook. Médio: mais partículas, árvores e nitidez.
// Alto: tudo isso mais o brilho (bloom) e a resolução máxima
export const QUALITY_LEVELS = ['low', 'medium', 'high'];
export const DEFAULT_QUALITY = 'low';
export const QUALITY_KEY = 'oku-quality';

// Número de um modelo de GPU no nome do renderizador ("Adreno (TM) 730" → 730)
const modelNumber = (text, prefix) => Number(text.match(new RegExp(`${prefix}\\D{0,6}(\\d{2,4})`))?.[1] ?? 0);

// Nível inicial pela placa de vídeo (nome do WEBGL_debug_renderer_info). Na dúvida, o mínimo: o
// monitor de FPS da cena só desce de nível, nunca sobe
export function autoQuality(renderer, { mobile = false } = {}) {
  const r = String(renderer ?? '').toLowerCase();
  if (!r || /swiftshader|llvmpipe|softpipe|software|basic render|warp/.test(r)) return 'low';
  // Dedicadas no desktop: NVIDIA (fora o Tegra dos portáteis), Radeon RX/Pro, Intel Arc
  if (/nvidia|geforce|quadro|\brtx\b|\bgtx\b/.test(r) && !/tegra/.test(r)) return mobile ? 'medium' : 'high';
  if (/radeon.{0,8}\b(rx|pro|r9|vii)\b/.test(r) || /\barc\b.{0,6}a\d{3}/.test(r)) return 'high';
  // Apple: M1+ no Mac é alto; "Apple GPU" no iPhone/iPad fica no médio (bateria e calor)
  if (/apple m\d|apple gpu|apple a\d{2}/.test(r)) return mobile ? 'medium' : 'high';
  // Integradas boas: Iris Xe/Plus, Radeon dos Ryzen
  if (/iris|radeon/.test(r)) return 'medium';
  // Celulares: Adreno 640 em diante, Mali-G76/G78 e a geração G6xx/G7xx
  if (/adreno/.test(r)) return modelNumber(r, 'adreno') >= 640 ? 'medium' : 'low';
  if (/mali-g/.test(r)) {
    const n = modelNumber(r, 'mali-g');
    return n >= 610 || n === 76 || n === 77 || n === 78 ? 'medium' : 'low';
  }
  return 'low';
}

// Só a escolha salva pela pessoa (null sem escolha, com valor inválido ou storage bloqueado)
export function readSavedQuality(storage) {
  try {
    const saved = storage?.getItem(QUALITY_KEY);
    return isQuality(saved) ? saved : null;
  } catch {
    return null;
  }
}

export const QUALITY_SETTINGS = {
  // grade: a gradação de cor (vinheta, grão, luzes altas) e o SMAA num passe de pós-processamento
  low: { dpr: 1, particles: 300, postprocessing: false, grade: false, antialias: false },
  medium: { dpr: [1, 1.25], particles: 800, postprocessing: false, grade: true, antialias: false },
  // Com o bloom a cena é desenhada numa textura antes da tela, sem antialias no canvas (pagaria a
  // conta sem efeito). Também sem multisampling no EffectComposer: no Chrome (ANGLE/D3D11) o MSAA
  // na textura HalfFloat junto com o mipmapBlur do bloom apagava a tela inteira perto do rio, e
  // ainda custava caro. A resolução até 1,5x já suaviza as bordas
  high: { dpr: [1, 1.5], particles: 1500, postprocessing: true, grade: true, antialias: false, multisampling: 0 },
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
