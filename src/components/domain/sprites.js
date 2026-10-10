// Peças do portfólio que saem do orbe no Vazio Infinito, desenhadas uma vez em canvas (depois cada
// quadro só copia a imagem, escalada). Contam a história nesta ordem: os projetos (do IMACARDIOS em
// diante, com a stack de cada um), os números reais da experiência, e depois a enxurrada: as tiras
// do Tanabata do Stack, o nome 奥山 e as quatro estações
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

// 作: cartão de projeto escuro, numeral em kanji vermelho, título em serifa e a stack embaixo
function projectCard(project, index, fonts, label) {
  const s = surface(280, 158);
  const { ctx } = s;
  rounded(ctx, 2, 2, 276, 154, 10);
  const bg = ctx.createLinearGradient(0, 0, 0, 158);
  bg.addColorStop(0, '#18213a');
  bg.addColorStop(1, '#0f1528');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(160, 190, 255, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#e8665a';
  ctx.font = `700 24px ${fonts.jp}`;
  ctx.textBaseline = 'top';
  ctx.fillText(kanjiNumber(index), 18, 16);
  ctx.fillStyle = 'rgba(217, 164, 65, 0.9)';
  ctx.font = `600 10px ${fonts.sans}`;
  ctx.fillText(`${label} ${String(index + 1).padStart(2, '0')}`, 60, 24);
  ctx.fillStyle = '#eef2ff';
  ctx.font = `700 19px ${fonts.serif}`;
  // Quebra o título em até duas linhas
  const words = project.title.split(' ');
  const lines = [''];
  words.forEach((w) => {
    const next = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${w}` : w;
    if (ctx.measureText(next).width > 244 && lines[lines.length - 1]) lines.push(w);
    else lines[lines.length - 1] = next;
  });
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 18, 56 + i * 24));
  // Stack: as três primeiras ferramentas, em pílulas
  ctx.font = `600 10px ${fonts.sans}`;
  let x = 18;
  (project.stack ?? []).slice(0, 3).forEach((tech) => {
    const tw = ctx.measureText(tech).width + 14;
    if (x + tw > 262) return;
    rounded(ctx, x, 120, tw, 20, 10);
    ctx.fillStyle = 'rgba(120, 160, 255, 0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(150, 185, 255, 0.35)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(225, 233, 255, 0.85)';
    ctx.fillText(tech, x + 7, 125);
    x += tw + 6;
  });
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

// 奥山: o nome em kanji, em papel claro com o carimbo vermelho, como um 表札
function nameplate(fonts) {
  const s = surface(120, 220);
  const { ctx } = s;
  rounded(ctx, 6, 4, 108, 212, 6);
  ctx.fillStyle = '#efe6d2';
  ctx.fill();
  ctx.strokeStyle = 'rgba(80, 50, 20, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#1d1712';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 54px ${fonts.jp}`;
  ctx.fillText('奥', 60, 62);
  ctx.fillText('山', 60, 126);
  ctx.fillStyle = '#c23b30';
  rounded(ctx, 44, 168, 32, 32, 3);
  ctx.fill();
  ctx.fillStyle = '#f6eee0';
  ctx.font = `700 15px ${fonts.jp}`;
  ctx.fillText('芳', 60, 185);
  return s;
}

// 四季: as quatro estações da montanha, cada uma num disco com a sua cor
const SEASONS = [['春', '#f0a8bd', '#5a2333'], ['夏', '#4f9a5b', '#f3f8ee'], ['秋', '#d8572a', '#fff3e6'], ['冬', '#b9c6d6', '#22324a']];
function season([kanji, bg, ink], fonts) {
  const s = surface(96, 96);
  const { ctx } = s;
  ctx.beginPath();
  ctx.arc(48, 48, 44, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 46px ${fonts.jp}`;
  ctx.fillText(kanji, 48, 50);
  return s;
}

const shuffle = (list) => {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

// As peças, montadas aos poucos: cada peça é um canvas desenhado com texto, e desenhar as ~60 de uma
// vez segurava a página ~100 ms logo depois de o domínio abrir. Aqui saem algumas por quadro (até
// ~4 ms de trabalho), a história primeiro; `out` vai sendo preenchido e `cancel()` para no meio
export function buildSpritesGradually(data, metrics, fonts, lang, out) {
  const label = lang === 'en' ? 'PROJECT' : 'PROJETO';
  const projects = [];
  const numbers = [];
  const rest = [];
  const jobs = [
    ...data.projects.slice(0, 8).map((p, i) => () => { projects[i] = projectCard(p, i, fonts, label); }),
    ...metrics.map(([v, l], i) => () => { numbers[i] = metric(v, l, fonts); }),
    // A história fica pronta assim que os projetos e os números existem
    () => {
      out.story = [projects[0], numbers[0], projects[1], numbers[1], projects[2], projects[3], numbers[2], projects[4], numbers[3]].filter(Boolean);
    },
    ...data.techSection.categories.flatMap((cat, area) => cat.items.map((tool) => () => { rest.push(tanzaku(tool, area, cat.kanji, fonts)); })),
    () => { rest.push(nameplate(fonts)); },
    ...SEASONS.map((x) => () => { rest.push(season(x, fonts)); }),
    () => {
      const identity = rest.slice(-5);
      out.flood = shuffle([...projects, ...numbers, ...rest, ...identity]);
    },
  ];
  let raf = 0;
  const step = () => {
    const until = performance.now() + 4;
    while (jobs.length && performance.now() < until) jobs.shift()();
    if (jobs.length) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
