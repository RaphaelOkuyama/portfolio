// Fonte para as imagens de compartilhamento: Shippori Mincho só com os caracteres usados.
// Sem User-Agent o Google Fonts entrega TTF (o next/og não lê woff2).
// Baixada na hora do build: a rede pode falhar ou o Google devolver uma página de erro no lugar da
// fonte (já derrubou um deploy). Por isso tenta algumas vezes e confere se veio mesmo uma fonte

const TRIES = 3;

// TrueType (00 01 00 00 ou "true") e OpenType ("OTTO")
export function isFontData(buffer) {
  if (!buffer || buffer.byteLength < 4) return false;
  const b = new Uint8Array(buffer, 0, 4);
  const tag = String.fromCharCode(...b);
  return (b[0] === 0 && b[1] === 1 && b[2] === 0 && b[3] === 0) || tag === 'OTTO' || tag === 'true';
}

async function fetchOk(url, as) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return as === 'text' ? res.text() : res.arrayBuffer();
}

export async function loadMincho(text, weight) {
  const chars = encodeURIComponent([...new Set(text)].join(''));
  let lastError = null;
  for (let attempt = 0; attempt < TRIES; attempt += 1) {
    try {
      const css = await fetchOk(`https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@${weight}&text=${chars}`, 'text');
      const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
      if (!url) throw new Error('Fonte não encontrada no CSS do Google Fonts');
      const data = await fetchOk(url, 'buffer');
      if (!isFontData(data)) throw new Error('O Google Fonts não devolveu uma fonte');
      return data;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw lastError;
}
