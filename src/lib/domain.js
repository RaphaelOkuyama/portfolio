// 領域展開 · 無量空処: easter egg do Vazio Infinito (homenagem a Jujutsu Kaisen). Funções puras:
// o gatilho por teclado, as palavras que voam no vazio e os cacos de vidro da saída

export const DOMAIN = {
  // Palavras secretas (digitadas fora de campos de texto) e quanto segurar o kanji 技 (ms)
  words: ['domain', 'muryokusho', 'ryoiki'],
  hold: 900,
  // Fases (s): ativação e expansão até o vazio cobrir tudo (0–2,0), informação infinita até a
  // quebra (2,0–6,0, com a saturação no fim) e a reconstrução (~1,6)
  close: 2.0,
  void: 4.0,
  shatter: 1.6,
};

// Guarda as últimas teclas e diz se alguma palavra secreta acabou de ser digitada
export function typedSecret(buffer, key, words = DOMAIN.words) {
  const longest = Math.max(...words.map((w) => w.length));
  const next = (buffer + (key.length === 1 ? key.toLowerCase() : '')).slice(-longest);
  return { buffer: next, hit: words.some((w) => next.endsWith(w)) };
}

// Informação infinita: as ferramentas do Stack, os números da experiência e uns kanji
export function domainWords(categories, numbers = []) {
  const tools = categories.flatMap((c) => c.items);
  return [...tools, ...numbers, '無量空処', '情報', '∞', '領域展開', ...categories.map((c) => c.kanji)];
}

// Corta um polígono convexo pelo semiplano dos pontos mais perto de `a` do que de `b`
function clipCloser(poly, a, b) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const nx = b[0] - a[0];
  const ny = b[1] - a[1];
  const side = (p) => (p[0] - mx) * nx + (p[1] - my) * ny; // <= 0: lado de a
  const out = [];
  for (let i = 0; i < poly.length; i += 1) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const sp = side(p);
    const sq = side(q);
    if (sp <= 0) out.push(p);
    if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

// Células de Voronoi dos pontos `sites` dentro da tela: cada célula é a região mais perto do seu
// ponto. Devolve [{ poly, center, site, index }] (células degeneradas ficam de fora)
export function voronoiCells(sites, w, h) {
  const rect = [[0, 0], [w, 0], [w, h], [0, h]];
  return sites.map((s, index) => {
    let poly = rect;
    for (const o of sites) {
      if (o === s || poly.length < 3) continue;
      if (o[0] === s[0] && o[1] === s[1]) continue;
      poly = clipCloser(poly, s, o);
    }
    if (poly.length < 3) return null;
    const center = poly.reduce((m, p) => [m[0] + p[0] / poly.length, m[1] + p[1] / poly.length], [0, 0]);
    return { poly, center, site: s, index };
  }).filter(Boolean);
}

// Cacos irregulares (células de Voronoi): pequenos perto do impacto, grandes longe dele, como vidro
// de verdade. Cada caco: { poly, center, dist } com dist = distância do impacto (0..1 da diagonal)
export function voronoiShards(cx, cy, w, h, count = 38, rand = Math.random) {
  const diag = Math.hypot(w, h);
  const sites = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 * 2.618 + rand() * 0.8;
    const r = diag * 0.75 * (0.03 + 0.97 * ((i + rand()) / count) ** 1.7);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  return voronoiCells(sites, w, h).map((c) => ({ ...c, dist: Math.hypot(c.center[0] - cx, c.center[1] - cy) / diag }));
}

// Retângulo (DOMRect-like) como polígono, no sentido horário a partir do canto de cima à esquerda
export const rectPoly = ({ x, y, width, height }) => [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];

// Reamostra um polígono fechado em `n` pontos igualmente espaçados no contorno, começando pelo
// vértice mais em cima à esquerda (assim dois polígonos reamostrados se correspondem ponto a ponto
// e dá para transformar um no outro sem torcer)
export function resample(poly, n) {
  let start = 0;
  poly.forEach((p, i) => {
    if (p[0] + p[1] < poly[start][0] + poly[start][1]) start = i;
  });
  const pts = [...poly.slice(start), ...poly.slice(0, start)];
  // Mesmo sentido para todos (horário na tela, com y para baixo: área positiva)
  const area = pts.reduce((s, p, i) => {
    const q = pts[(i + 1) % pts.length];
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0);
  if (area < 0) pts.splice(1, pts.length - 1, ...pts.slice(1).reverse());
  const seg = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  const total = seg.reduce((s, l) => s + l, 0) || 1;
  const out = [];
  let i = 0;
  let acc = 0;
  for (let k = 0; k < n; k += 1) {
    const target = (k / n) * total;
    while (i < seg.length - 1 && acc + seg[i] < target) {
      acc += seg[i];
      i += 1;
    }
    const t = seg[i] ? (target - acc) / seg[i] : 0;
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
  }
  return out;
}

// Elementos da página que o domínio reconstrói: folhas visíveis (títulos, textos, botões, imagens,
// cartões) dentro da tela, sem os que contêm outro escolhido. items: [{ el, rect }] (rect = getBoundingClientRect)
export function pickTargets(items, w, h, max = 36) {
  const visible = items.filter(({ rect: r }) => r.width * r.height > 900 && r.width < w * 0.95
    && r.bottom > 0 && r.right > 0 && r.top < h && r.left < w);
  const leaves = visible.filter((a) => !visible.some((b) => b !== a && a.el?.contains?.(b.el)));
  return leaves.sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height).slice(0, max);
}
