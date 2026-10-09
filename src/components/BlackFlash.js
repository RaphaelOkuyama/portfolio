'use client';
import { useEffect, useMemo } from 'react';

// 黒閃 (Black Flash): o golpe certeiro na katana. A tela inverte por um instante (o negativo
// preto e vermelho do anime), raios vermelhos atravessam do ponto do golpe e o 黒閃 bate no centro
// em pincelada. Some sozinho (~0,9 s); não segura cliques
const DURATION = 900;

// Raio em zigue-zague de um ponto para fora da tela
function bolt(x, y, angle, length) {
  const points = [[x, y]];
  let px = x;
  let py = y;
  const steps = 7;
  for (let i = 1; i <= steps; i += 1) {
    const jitter = (Math.random() - 0.5) * 0.7;
    px += Math.cos(angle + jitter) * (length / steps);
    py += Math.sin(angle + jitter) * (length / steps);
    points.push([px, py]);
  }
  return points.map((p) => p.join(',')).join(' ');
}

export default function BlackFlash({ x, y, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, DURATION);
    return () => clearTimeout(id);
  }, [onDone]);

  const bolts = useMemo(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const len = Math.hypot(w, h);
    return Array.from({ length: 7 }, (_, i) => bolt(x, y, (i / 7) * Math.PI * 2 + Math.random() * 0.6, len * (0.35 + Math.random() * 0.4)));
  }, [x, y]);

  return (
    <div className="black-flash" aria-hidden="true">
      <svg className="black-flash-bolts" width="100%" height="100%">
        {bolts.map((points, i) => (
          <polyline key={i} points={points} />
        ))}
      </svg>
      <p className="black-flash-kanji font-jp" lang="ja">黒閃</p>
    </div>
  );
}
