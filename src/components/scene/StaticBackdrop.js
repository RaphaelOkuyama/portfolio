'use client';
import { SEASONS } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { ridgePoints } from '../../lib/journey/ridge';

const W = 1600;
const H = 900;

// Três camadas em coordenadas SVG (y para baixo: amplitude negativa sobe o relevo)
const LAYERS = [
  { seed: 7, base: 560, amp: 260, tone: 2 },
  { seed: 19, base: 660, amp: 220, tone: 1 },
  { seed: 31, base: 760, amp: 180, tone: 0 },
];

function layerPath({ seed, base, amp }) {
  const points = ridgePoints({ seed, width: W, segments: 80, baseHeight: base, amplitude: -amp });
  const ridge = points.map(([x, y]) => `L${(x + W / 2).toFixed(1)},${y.toFixed(1)}`).join(' ');
  return `M0,${H} ${ridge} L${W},${H} Z`;
}

// Fundo pintado para navegadores sem WebGL: primavera do tema atual
export default function StaticBackdrop({ theme }) {
  const season = sampleSeason(SEASONS[theme], 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width={W} height={H} fill={season.sky} />
      {LAYERS.map((layer) => (
        <path key={layer.seed} d={layerPath(layer)} fill={season.mountains[layer.tone]} />
      ))}
    </svg>
  );
}
