'use client';
import { useCallback, useMemo } from 'react';
import { effectiveProgress, useJourney } from '../../store/journey';
import { smoothstep, winterWeight } from '../../lib/journey/math';
import FallingLeaves from './FallingLeaves';
import { createCameraCurve } from './cameraCurve';
import { SNOW } from './config';

// 雪: flocos finos da Experiência até o fim da jornada
export default function Snow() {
  const start = useJourney((s) => s.sectionRanges.experience?.[0]) ?? SNOW.fallbackStart;
  const curve = useMemo(() => createCameraCurve(), []);

  // Caixa em volta do trecho final do caminho (do começo da Experiência até o fim)
  const volume = useMemo(() => {
    const c = curve.getPointAt((start + 1) / 2);
    const [hx, hy, hz] = SNOW.halfSize;
    return { x: [c.x - hx, c.x + hx], y: [c.y - hy, c.y + hy], z: [c.z - hz, c.z + hz] };
  }, [curve, start]);

  const weight = useCallback(
    (journey) => winterWeight(journey.seasonMix) * smoothstep(start - 0.04, start + 0.02, effectiveProgress(journey)),
    [start],
  );

  return (
    <FallingLeaves
      volume={volume}
      seed={53}
      size={SNOW.size}
      accent="snow"
      weight={weight}
      countScale={SNOW.countScale}
    />
  );
}
