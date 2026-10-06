// 領域展開 · 無量空処: easter egg do Vazio Infinito (homenagem a Jujutsu Kaisen). Funções puras:
// o gatilho por teclado, as palavras que voam no vazio e os cacos de vidro da saída

export const DOMAIN = {
  // Palavras secretas (digitadas fora de campos de texto) e quanto segurar o kanji 技 (ms)
  words: ['domain', 'muryokusho', 'ryoiki'],
  hold: 900,
  // Fases (s): o domínio fecha, o vazio dura, os cacos caem
  close: 1.1,
  void: 6.5,
  shatter: 1.3,
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

// Cacos irregulares (células de Voronoi): pequenos perto do impacto, grandes longe dele, como vidro
// de verdade. Cada caco: { poly, center, dist } com dist = distância do impacto (0..1 da diagonal)
export function voronoiShards(cx, cy, w, h, count = 38, rand = Math.random) {
  const diag = Math.hypot(w, h);
  const sites = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 * 2.618 + rand() * 0.8;
    const r = diag * 0.75 * (0.03 + 0.97 * ((i + rand()) / count) ** 1.7);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  const rect = [[0, 0], [w, 0], [w, h], [0, h]];
  return sites.map((s) => {
    let poly = rect;
    for (const o of sites) {
      if (o === s || poly.length < 3) continue;
      poly = clipCloser(poly, s, o);
    }
    if (poly.length < 3) return null;
    const center = poly.reduce((m, p) => [m[0] + p[0] / poly.length, m[1] + p[1] / poly.length], [0, 0]);
    return { poly, center, dist: Math.hypot(center[0] - cx, center[1] - cy) / diag };
  }).filter(Boolean);
}
