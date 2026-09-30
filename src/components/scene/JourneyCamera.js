'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { journeyStore, effectiveProgress } from '../../store/journey';
import { clamp01 } from '../../lib/journey/season';
import { createCameraCurve } from './cameraCurve';

// Câmera percorre a curva conforme o progresso (amortecido; imediato em reduced motion)
export default function JourneyCamera() {
  const curve = useMemo(() => createCameraCurve(), []);
  const current = useRef(null);
  const position = useMemo(() => new Vector3(), []);
  const tangent = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const journey = journeyStore.getState();
    const target = effectiveProgress(journey);
    if (current.current === null) current.current = target;
    const k = journey.reducedMotion ? 1 : 1 - Math.exp(-delta * 3);
    current.current += (target - current.current) * k;

    const t = clamp01(current.current);
    curve.getPointAt(t, position);
    curve.getTangentAt(t, tangent);
    state.camera.position.copy(position);
    state.camera.lookAt(position.x + tangent.x, position.y + tangent.y, position.z + tangent.z);

    if (Math.abs(target - current.current) > 1e-4) state.invalidate();
  });

  return null;
}
