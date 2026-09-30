'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { journeyStore, effectiveProgress } from '../../store/journey';
import { clamp01 } from '../../lib/journey/season';
import { currentCameraMap, getCameraCurve } from './useCameraMap';
import { cameraT } from '../../lib/journey/cameraMap';
import { CAMERA_FLIGHT } from './config';
import { power2InOut, responsiveFov } from '../../lib/journey/math';

// Câmera percorre a curva conforme o progresso (amortecido; imediato em reduced motion)
export default function JourneyCamera() {
  const curve = getCameraCurve();
  const current = useRef(null);
  const position = useMemo(() => new Vector3(), []);
  const tangent = useMemo(() => new Vector3(), []);

  // Celular em pé: abre o FOV vertical para o enquadramento não ficar só no torii
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.fov = responsiveFov(aspect);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, aspect, invalidate]);

  // Troca de rota (jornada ↔ rota congelada): voo de 1,2s com power2.inOut até o novo ponto
  const flight = useRef(null);
  const lastRoute = useRef(null);

  useFrame((state, delta) => {
    const journey = journeyStore.getState();
    const target = effectiveProgress(journey);
    if (current.current === null) current.current = target;

    if (lastRoute.current !== null && journey.route !== lastRoute.current && !journey.reducedMotion) {
      flight.current = { from: current.current, elapsed: 0 };
    }
    lastRoute.current = journey.route;

    if (flight.current) {
      // Delta limitado: no frameloop "demand" o primeiro frame pode vir depois de uma pausa longa
      flight.current.elapsed += Math.min(delta, 1 / 30);
      const p = Math.min(1, flight.current.elapsed / CAMERA_FLIGHT.duration);
      current.current = flight.current.from + (target - flight.current.from) * power2InOut(p);
      if (p >= 1) flight.current = null;
      state.invalidate();
    } else {
      const k = journey.reducedMotion ? 1 : 1 - Math.exp(-delta * 3);
      current.current += (target - current.current) * k;
    }

    // Progresso → posição na curva (acelera até o torii, ver cameraMap.js)
    const t = cameraT(clamp01(current.current), currentCameraMap(journey));
    curve.getPointAt(t, position);
    curve.getTangentAt(t, tangent);
    state.camera.position.copy(position);
    state.camera.lookAt(position.x + tangent.x, position.y + tangent.y, position.z + tangent.z);

    if (Math.abs(target - current.current) > 1e-4) state.invalidate();
  });

  return null;
}
