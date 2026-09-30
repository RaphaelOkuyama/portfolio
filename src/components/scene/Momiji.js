'use client';
import { useCallback, useMemo } from 'react';
import { effectiveProgress, useJourney } from '../../store/journey';
import { autumnWeight, bandOpacity } from '../../lib/journey/math';
import FallingLeaves from './FallingLeaves';
import { createCameraCurve } from './cameraCurve';
import { MOMIJI } from './config';

// 紅葉: folhas de bordo caem em volta da câmera enquanto o emakimono dos Projetos rola
export default function Momiji() {
  const range = useJourney((s) => s.sectionRanges.projects) ?? MOMIJI.fallbackRange;
  const [start, end] = range;
  const curve = useMemo(() => createCameraCurve(), []);

  // Caixa centrada no ponto da curva no meio da seção
  const volume = useMemo(() => {
    const c = curve.getPointAt((start + end) / 2);
    const [hx, hy, hz] = MOMIJI.halfSize;
    return { x: [c.x - hx, c.x + hx], y: [c.y - hy, c.y + hy], z: [c.z - hz, c.z + hz] };
  }, [curve, start, end]);

  const weight = useCallback(
    // No 404 (迷子) só a névoa aparece
    (journey) => (journey.lost ? 0 : autumnWeight(journey.seasonMix) * bandOpacity(effectiveProgress(journey), start, end, 0.06)),
    [start, end],
  );

  return (
    <FallingLeaves
      volume={volume}
      seed={41}
      size={MOMIJI.size}
      accent="momiji"
      shape={1}
      weight={weight}
      countScale={MOMIJI.countScale}
    />
  );
}
