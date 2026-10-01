import { CanvasTexture, SRGBColorSpace } from 'three';
import { labelLayout } from '../../lib/journey/lanterns';

// Papel da lanterna na proporção da face (largura x altura)
const SIZE = [136, 160];
const cache = new Map();

// Família da fonte de display (next/font expõe em --font-display), com mincho de reserva
function brushFont(px) {
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
  return `800 ${px}px ${family || 'serif'}, 'Yu Mincho', 'Hiragino Mincho ProN', serif`;
}

// Tinta de pincel: várias passadas leves e deslocadas deixam a borda irregular
function inkText(ctx, text, x, y) {
  const passes = [[0, 0, 0.7], [0.8, -0.4, 0.35], [-0.6, 0.5, 0.3], [0.3, 0.9, 0.25]];
  passes.forEach(([dx, dy, alpha]) => {
    ctx.globalAlpha = alpha;
    ctx.fillText(text, x + dx, y + dy);
  });
  ctx.globalAlpha = 1;
}

// Textura com o nome escrito no papel: tategaki para nomes curtos, horizontal para os longos
export function labelTexture(label) {
  if (cache.has(label)) return cache.get(label);
  const [w, h] = SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2b1a0e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const { mode, chars } = labelLayout(label);
  if (mode === 'vertical') {
    const step = Math.min(34, (h - 24) / chars.length);
    ctx.font = brushFont(step * 0.92);
    const top = h / 2 - (step * (chars.length - 1)) / 2;
    chars.forEach((c, i) => inkText(ctx, c, w / 2, top + i * step));
  } else {
    let px = 40;
    ctx.font = brushFont(px);
    while (ctx.measureText(label).width > w - 16 && px > 12) {
      px -= 2;
      ctx.font = brushFont(px);
    }
    inkText(ctx, label, w / 2, h / 2);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  cache.set(label, texture);
  return texture;
}

// Textura vazia para os planos ainda sem nome (o shader já nasce com mapa, sem recompilar)
let blank = null;
export function blankTexture() {
  if (!blank) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    blank = new CanvasTexture(canvas);
  }
  return blank;
}
