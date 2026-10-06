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

// Cacos: raios saindo do ponto de impacto, cortados em anéis. Cada caco é um polígono (px) com
// centro, para girar e cair. `rand` injetável (testes)
export function shards(cx, cy, w, h, { rays = 14, rings = 4 } = {}, rand = Math.random) {
  const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.05;
  const angles = Array.from({ length: rays }, (_, i) => ((i + 0.3 + rand() * 0.4) / rays) * Math.PI * 2);
  const radii = [0, ...Array.from({ length: rings }, (_, i) => reach * ((i + 1) / rings) ** 1.35 * (0.9 + rand() * 0.2))];
  radii[radii.length - 1] = reach;
  const at = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  const list = [];
  for (let i = 0; i < rays; i += 1) {
    const a0 = angles[i];
    const a1 = angles[(i + 1) % rays] + (i === rays - 1 ? Math.PI * 2 : 0);
    for (let j = 0; j < rings; j += 1) {
      const r0 = radii[j];
      const r1 = radii[j + 1];
      const poly = r0 === 0 ? [at(a0, 0), at(a0, r1), at(a1, r1)] : [at(a0, r0), at(a0, r1), at(a1, r1), at(a1, r0)];
      const center = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]);
      list.push({ poly, center, ring: j });
    }
  }
  return list;
}
