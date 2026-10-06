// Peças do portfólio que saem do orbe no Vazio Infinito, desenhadas uma vez em canvas (depois cada
// quadro só copia a imagem, escalada): as tiras do Tanabata do Stack (cor da área, kanji e
// ferramenta), cartões de projeto (numeral em kanji e título) e os números da experiência
import { TANABATA_COLORS, TANABATA_INK } from '../../lib/journey/tanabata';
import { kanjiNumber } from '../../lib/kanji';

const SCALE = 2;

function surface(w, h) {
  const c = document.createElement('canvas');
  c.width = w * SCALE;
  c.height = h * SCALE;
  const ctx = c.getContext('2d');
  ctx.scale(SCALE, SCALE);
  return { c, ctx, w, h };
}

function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 短冊: tira vertical na cor da área, furo e cordão no alto, kanji e o nome escrito de pé
function tanzaku(tool, area, kanji, fonts) {
  const s = surface(64, 196);
  const { ctx } = s;
  ctx.fillStyle = TANABATA_COLORS[area % TANABATA_COLORS.length];
  rounded(ctx, 4, 10, 56, 182, 4);
  ctx.fill();
  // Fibras do papel: um degradê leve
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(32, 20, 3, 0, Math.PI * 2);
  ctx.fill();
  const ink = TANABATA_INK[area % TANABATA_INK.length];
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 26px ${fonts.jp}`;
  ctx.fillText(kanji, 32, 48);
  ctx.save();
  ctx.translate(32, 124);
  ctx.rotate(Math.PI / 2);
  ctx.font = `700 15px ${fonts.sans}`;
  let size = 15;
  while (ctx.measureText(tool).width > 118 && size > 9) {
    size -= 1;
    ctx.font = `700 ${size}px ${fonts.sans}`;
  }
  ctx.fillText(tool, 0, 0);
  ctx.restore();
  return s;
}

// 作: cartão de projeto escuro, numeral em kanji vermelho, título em serifa
function projectCard(title, index, fonts) {
  const s = surface(260, 132);
  const { ctx } = s;
  rounded(ctx, 2, 2, 256, 128, 10);
  ctx.fillStyle = '#141c30';
  ctx.fill();
  ctx.strokeStyle = 'rgba(160, 190, 255, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#e8665a';
  ctx.font = `700 24px ${fonts.jp}`;
  ctx.textBaseline = 'top';
  ctx.fillText(kanjiNumber(index), 18, 16);
  ctx.fillStyle = 'rgba(217, 164, 65, 0.9)';
  ctx.font = `600 10px ${fonts.sans}`;
  ctx.fillText(`PROJETO ${String(index + 1).padStart(2, '0')}`, 60, 24);
  ctx.fillStyle = '#eef2ff';
  ctx.font = `700 19px ${fonts.serif}`;
  // Quebra o título em até duas linhas
  const words = title.split(' ');
  const lines = [''];
  words.forEach((w) => {
    const next = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${w}` : w;
    if (ctx.measureText(next).width > 224 && lines[lines.length - 1]) lines.push(w);
    else lines[lines.length - 1] = next;
  });
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 18, 58 + i * 25));
  return s;
}

// Números da experiência: pílula com o número dourado e a legenda
function metric(value, label, fonts) {
  const s = surface(196, 70);
  const { ctx } = s;
  rounded(ctx, 2, 2, 192, 66, 33);
  ctx.fillStyle = 'rgba(14, 20, 38, 0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e9b44c';
  ctx.font = `700 26px ${fonts.serif}`;
  ctx.fillText(value, 22, 35);
  const w = ctx.measureText(value).width;
  ctx.fillStyle = 'rgba(230, 236, 250, 0.8)';
  ctx.font = `600 11px ${fonts.sans}`;
  ctx.fillText(label, 30 + w, 36);
  return s;
}

// Todas as peças, embaralhadas. `data` é resumeData[lang]
export function buildSprites(data, metrics, fonts) {
  const sprites = [];
  data.techSection.categories.forEach((cat, area) => {
    cat.items.forEach((tool) => sprites.push(tanzaku(tool, area, cat.kanji, fonts)));
  });
  data.projects.forEach((p, i) => sprites.push(projectCard(p.title, i, fonts)));
  metrics.forEach(([v, l]) => sprites.push(metric(v, l, fonts)));
  for (let i = sprites.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [sprites[i], sprites[j]] = [sprites[j], sprites[i]];
  }
  return sprites;
}
