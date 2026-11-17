// ガチャ: a máquina de cápsulas dos projetos. Funções puras: o que cabe nas cápsulas e o sorteio

// Cores das cápsulas por tipo de prêmio (a metade de cima; a de baixo é sempre papel)
export const CAPSULE = { project: '#c8322a', certificate: '#2f5d8a', fact: '#b98a2f' };

// Fatos soltos: os números reais da experiência e a origem do nome
const FACTS = {
  pt: [
    ['42+', 'clínicas atendidas pela plataforma de telecardiologia'],
    ['2.000+', 'laudos assinados por mês na IMACARDIOS'],
    ['-70%', 'no tempo de emissão de contratos'],
    ['-83%', 'de chamados de suporte'],
    ['40+', 'pontos de venda usando o sistema'],
    ['奥山', 'quer dizer "montanha profunda": o caminho deste site'],
  ],
  en: [
    ['42+', 'clinics served by the telecardiology platform'],
    ['2,000+', 'reports signed every month at IMACARDIOS'],
    ['-70%', 'in contract issuing time'],
    ['-83%', 'support tickets'],
    ['40+', 'points of sale running the system'],
    ['奥山', 'means "deep mountain": the path of this site'],
  ],
};

// Raridade, como nos gacha dos jogos: N (fatos), R (certificados e projetos de estudo), SR (os
// projetos da vitrine) e SSR (o projeto em produção). Estrelas e cor de cada uma
export const RARITY = {
  N: { stars: 1, color: '#9aa7bd' },
  R: { stars: 2, color: '#4f9bd9' },
  SR: { stars: 3, color: '#b06bff' },
  SSR: { stars: 4, color: '#ffc94d' },
};

// Tudo o que pode sair: projetos (metade das cápsulas), certificados e fatos. `showcase`: os
// slugs dos projetos da vitrine (viram SR)
export function gachaPool({ projects = [], certificates = [] }, lang = 'pt', showcase = []) {
  const pool = [];
  projects.forEach((p) => pool.push({
    kind: 'project', id: `p-${p.slug}`, title: p.title, text: p.shortDesc ?? '', href: `/projects/${p.slug}`,
    rarity: p.featured ? 'SSR' : showcase.includes(p.slug) ? 'SR' : 'R',
  }));
  certificates.forEach((c) => pool.push({
    kind: 'certificate', id: `c-${c.id}`, title: c.name, text: `${c.institution} · ${c.hours} h`, href: '/certificates', rarity: 'R',
  }));
  (FACTS[lang] ?? FACTS.pt).forEach(([title, text], i) => pool.push({ kind: 'fact', id: `f-${i}`, title, text, href: null, rarity: 'N' }));
  return pool;
}

// 図鑑: a coleção, isto é, os prêmios que já saíram (ids), guardada no navegador
export const GACHA_KEY = 'gacha-collection';

export function readCollection(storage, pool) {
  try {
    const raw = JSON.parse(storage.getItem(GACHA_KEY) ?? '[]');
    const known = new Set(pool.map((item) => item.id));
    return Array.isArray(raw) ? [...new Set(raw.filter((id) => known.has(id)))] : [];
  } catch {
    return [];
  }
}

// Junta um prêmio à coleção. Devolve { collection, fresh } (fresh: ainda não tinha saído)
export function collect(storage, collection, id) {
  if (collection.includes(id)) return { collection, fresh: false };
  const next = [...collection, id];
  try {
    storage.setItem(GACHA_KEY, JSON.stringify(next));
  } catch {
    // Storage bloqueado: a coleção só não persiste
  }
  return { collection: next, fresh: true };
}

const WEIGHTS = [['project', 0.5], ['certificate', 0.25], ['fact', 0.25]];

// Sorteia um prêmio: primeiro o tipo (pelo peso), depois um item dele; nunca o mesmo duas vezes
// seguidas. `rand` devolve [0, 1) (injetável para teste)
export function gachaDraw(pool, rand = Math.random, lastId = null) {
  const kinds = WEIGHTS.filter(([kind]) => pool.some((item) => item.kind === kind && item.id !== lastId));
  if (!kinds.length) return pool[0] ?? null;
  const total = kinds.reduce((sum, [, w]) => sum + w, 0);
  let roll = rand() * total;
  let picked = kinds[kinds.length - 1][0];
  for (const [kind, w] of kinds) {
    if (roll < w) { picked = kind; break; }
    roll -= w;
  }
  const items = pool.filter((item) => item.kind === picked && item.id !== lastId);
  return items[Math.min(items.length - 1, Math.floor(rand() * items.length))];
}
