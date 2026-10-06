// 盆栽: o desenho do bonsai do Stack (viewBox 400 × 430). O tronco sobe em curvas; cada galho
// termina numa copa (o botão de uma área) e as folhas em volta dela são as ferramentas da área
export const VIEW = { w: 400, h: 430 };

export const TRUNK = 'M200 398 C 196 370, 166 352, 172 318 C 178 286, 224 268, 218 232 C 212 198, 178 188, 184 152 C 190 120, 222 104, 212 76';
// Uma segunda linha mais fina por cima do tronco: o veio da madeira
export const GRAIN = 'M203 392 C 200 368, 174 350, 178 318 C 183 288, 226 268, 221 234';

// Ponta de cada galho (centro da copa) e o galho que leva até ela, na ordem das áreas do Stack
export const PADS = [
  { x: 82, y: 302, branch: 'M176 324 Q 128 334, 96 306' },
  { x: 318, y: 262, branch: 'M214 252 Q 272 276, 304 264' },
  { x: 86, y: 198, branch: 'M198 216 Q 142 224, 100 200' },
  { x: 316, y: 158, branch: 'M188 170 Q 256 184, 302 160' },
  { x: 108, y: 94, branch: 'M190 132 Q 140 122, 116 98' },
  { x: 268, y: 56, branch: 'M210 96 Q 238 66, 262 58' },
];

// Folhas em volta da copa: uma por ferramenta, numa elipse com um pouco de variação (posição
// determinística: o mesmo desenho no servidor e no cliente)
export function leavesAround(pad, count, index) {
  return Array.from({ length: count }, (_, k) => {
    const a = (k / count) * Math.PI * 2 + index * 0.7 + Math.sin(k * 2.3 + index) * 0.18;
    const r = 1 + Math.sin(k * 1.7 + index * 3.1) * 0.08;
    return {
      x: +(pad.x + Math.cos(a) * 62 * r).toFixed(1),
      y: +(pad.y + Math.sin(a) * 40 * r).toFixed(1),
      rotate: +((a * 180) / Math.PI + 90).toFixed(1),
      tone: k % 2,
    };
  });
}
