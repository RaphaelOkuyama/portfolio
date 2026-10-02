// Fonte para as imagens de compartilhamento: Shippori Mincho só com os caracteres usados.
// Sem User-Agent o Google Fonts entrega TTF (o next/og não lê woff2).
export async function loadMincho(text, weight) {
  const chars = encodeURIComponent([...new Set(text)].join(''));
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@${weight}&text=${chars}`,
  ).then((res) => res.text());
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error('Fonte não encontrada no CSS do Google Fonts');
  return fetch(url).then((res) => res.arrayBuffer());
}
