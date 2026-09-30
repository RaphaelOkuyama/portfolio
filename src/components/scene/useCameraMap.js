'use client';
import { useMemo } from 'react';
import { journeyStore, useJourney } from '../../store/journey';
import { cameraMapParams, cameraT } from '../../lib/journey/cameraMap';
import { createCameraCurve } from './cameraCurve';
import { TORII } from './config';

// Curva compartilhada (mesmo comprimento para todos)
const curve = createCameraCurve();
const curveLength = curve.getLength();

export function getCameraCurve() {
  return curve;
}

// Parâmetros do mapa para o estado atual (uso em useFrame, sem re-render)
export function currentCameraMap(state = journeyStore.getState()) {
  return cameraMapParams(state.sectionRanges.about ?? TORII.fallbackRange, curveLength, TORII);
}

// Hook para posicionar objetos: converte progresso em ponto da curva
export function useCameraMap() {
  const about = useJourney((s) => s.sectionRanges.about) ?? TORII.fallbackRange;
  return useMemo(() => {
    const params = cameraMapParams(about, curveLength, TORII);
    return { params, toCurve: (progress) => cameraT(progress, params) };
  }, [about]);
}
