import { CanvasTexture, SRGBColorSpace } from 'three';
import { labelLayout } from '../../lib/journey/lanterns';

// Papel da lanterna na proporção da face (largura x altura), em resolução alta: com 136 × 160 o
// nome ficava borrado assim que a lanterna se afastava
const SIZE = [544, 640];
const cache = new Map();

// Família da fonte de display (next/font expõe em --font-display), com mincho de reserva
function brushFont(px) {
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
  return `800 ${px}px ${family || 'serif'}, 'Yu Mincho', 'Hiragino Mincho ProN', serif`;
}

// Tinta de pincel: um contorno escuro grosso (legível sobre o papel aceso) e o preenchimento com
// duas passadas um pouco deslocadas, que deixam a borda irregular
function inkText(ctx, text, x, y, px) {
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, px * 0.1);
  ctx.strokeStyle = 'rgba(20, 10, 4, 0.55)';
  ctx.strokeText(text, x, y);
  [[0, 0, 1], [px * 0.02, -px * 0.015, 0.45]].forEach(([dx, dy, alpha]) => {
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
  ctx.fillStyle = '#140a04';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const { mode, chars, lines } = labelLayout(label);
  if (mode === 'vertical') {
    const step = Math.min(136, (h - 96) / chars.length);
    ctx.font = brushFont(step * 0.92);
    const top = h / 2 - (step * (chars.length - 1)) / 2;
    chars.forEach((c, i) => inkText(ctx, c, w / 2, top + i * step, step));
  } else {
    // Maior letra que cabe na largura, para todas as linhas
    let px = lines.length > 1 ? 120 : 150;
    ctx.font = brushFont(px);
    const widest = () => Math.max(...lines.map((line) => ctx.measureText(line).width));
    while (widest() > w - 56 && px > 40) {
      px -= 4;
      ctx.font = brushFont(px);
    }
    const gap = px * 1.12;
    const top = h / 2 - (gap * (lines.length - 1)) / 2;
    lines.forEach((line, i) => inkText(ctx, line, w / 2, top + i * gap, px));
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
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
