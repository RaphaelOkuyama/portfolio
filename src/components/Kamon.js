import { useId } from 'react';

// 家紋 (kamon): o brasão da família 奥山, "montanha profunda". Um anel (丸, maru) com três
// picos (三つ山) e duas faixas de névoa (霞, kasumi) embaixo, chapado em uma cor só como os
// brasões tradicionais. A neve do pico do meio é um recorte (o fundo aparece por ela).
// Grade de 100×100; a cor vem de `currentColor`.
export const KAMON_PATHS = {
  ring: { cx: 50, cy: 50, r: 44, strokeWidth: 7 },
  mountain: 'M18 66 L36 41 L44 51 L50 25 L56 51 L64 41 L82 66 Z',
  snow: 'M50 31 L53.2 44 L50 41 L46.8 44 Z',
  mist: [
    { x: 27, y: 72, width: 46, height: 5, rx: 2.5 },
    { x: 35, y: 80, width: 30, height: 5, rx: 2.5 },
  ],
};

export default function Kamon({ size = 32, title, className, ...rest }) {
  const maskId = `kamon-snow-${useId().replace(/:/g, '')}`;
  const { ring, mountain, snow, mist } = KAMON_PATHS;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-kamon=""
      {...rest}
    >
      <defs>
        <mask id={maskId}>
          <rect width="100" height="100" fill="#fff" />
          <path d={snow} fill="#000" />
        </mask>
      </defs>
      <circle cx={ring.cx} cy={ring.cy} r={ring.r} fill="none" stroke="currentColor" strokeWidth={ring.strokeWidth} />
      <path d={mountain} fill="currentColor" mask={`url(#${maskId})`} />
      {mist.map((m) => <rect key={m.y} {...m} fill="currentColor" />)}
    </svg>
  );
}
