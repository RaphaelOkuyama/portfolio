'use client';
import { SEASONS, SCENE_ACCENTS } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { ridgePoints } from '../../lib/journey/ridge';
import { cedarPath, cedarsOnRidge, riverPath, ridgeY } from '../../lib/journey/backdrop';

const W = 1600;
const H = 900;
// Vale no meio da camada da frente: é de lá que o rio desce
const VALLEY = { center: 0, depth: 0.85, width: 150 };

function ridge({ seed, base, amp, valley }) {
  return ridgePoints({
    seed, width: W, segments: 80, baseHeight: base, amplitude: -amp,
    ...(valley ? { valleyCenter: valley.center, valleyDepth: valley.depth, valleyWidth: valley.width } : {}),
  }).map(([x, y]) => [x + W / 2, y]);
}

function fillPath(points) {
  return `M0,${H} ${points.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} L${W},${H} Z`;
}

// Geometria fixa: calculada uma vez, só as cores mudam com tema e estação
const FAR = ridge({ seed: 7, base: 540, amp: 260 });
const MID = ridge({ seed: 19, base: 650, amp: 210 });
const NEAR = ridge({ seed: 31, base: 790, amp: 170, valley: VALLEY });

const MID_TREES = cedarsOnRidge({ seed: 5, points: MID, count: 70, minHeight: 14, maxHeight: 26 })
  .map((t) => cedarPath(t.x, t.y, t.h)).join(' ');
const NEAR_TREES = cedarsOnRidge({
  seed: 11, points: NEAR, count: 34, minHeight: 46, maxHeight: 92, avoid: [W / 2 - 230, W / 2 + 230], sink: 10,
}).map((t) => cedarPath(t.x, t.y, t.h)).join(' ');

const RIVER_TOP = ridgeY(NEAR, W / 2) + 6;
const RIVER = riverPath({ topX: W / 2, topY: RIVER_TOP, bottomY: H + 20, topWidth: 14, bottomWidth: 760, sway: 160, seed: 3 });
const RIVER_GLINT = riverPath({ topX: W / 2 + 6, topY: RIVER_TOP + 30, bottomY: H + 20, topWidth: 2, bottomWidth: 90, sway: 150, seed: 3 });

// Fundo pintado para navegadores sem WebGL: a mesma montanha da cena 3D em camadas de SVG,
// com névoa entre as cristas, cedros e o rio, nas cores da estação atual
export default function StaticBackdrop({ theme, mix = 0 }) {
  const season = sampleSeason(SEASONS[theme], mix);
  const accents = SCENE_ACCENTS[theme];
  const [near, mid, far] = season.mountains;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className="static-backdrop"
      data-season-mix={mix}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={season.sky} />
          <stop offset="0.7" stopColor={season.fog} />
        </linearGradient>
        <linearGradient id="bd-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={season.fog} stopOpacity="0" />
          <stop offset="0.5" stopColor={season.fog} stopOpacity="0.75" />
          <stop offset="1" stopColor={season.fog} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bd-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={season.fog} />
          <stop offset="1" stopColor={accents.water} />
        </linearGradient>
        <radialGradient id="bd-glow">
          <stop offset="0" stopColor={accents.celestial} stopOpacity="0.45" />
          <stop offset="1" stopColor={accents.celestial} stopOpacity="0" />
        </radialGradient>
        <filter id="bd-soft" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#bd-sky)" />
      <circle cx={1210} cy={190} r={170} fill="url(#bd-glow)" />
      <circle cx={1210} cy={190} r={46} fill={accents.celestial} opacity="0.9" />

      <path d={fillPath(FAR)} fill={far} />
      <g className="backdrop-mist" filter="url(#bd-soft)">
        <rect x={-100} y={430} width={W + 200} height={180} fill="url(#bd-mist)" />
      </g>

      <path d={fillPath(MID)} fill={mid} />
      <path d={MID_TREES} fill={mid} data-trees="mid" />
      <g className="backdrop-mist is-slow" filter="url(#bd-soft)">
        <rect x={-100} y={590} width={W + 200} height={170} fill="url(#bd-mist)" />
      </g>

      <path d={fillPath(NEAR)} fill={near} />
      <path d={NEAR_TREES} fill={near} data-trees="near" />
      <path d={RIVER} fill="url(#bd-river)" data-river="" />
      <path d={RIVER_GLINT} fill={season.sky} opacity="0.25" />
    </svg>
  );
}
