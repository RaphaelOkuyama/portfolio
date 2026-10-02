'use client';
import { useMemo } from 'react';
import { Vector3 } from 'three';
import ToriiGate, { useToriiMaterials } from './ToriiGate';
import { getCameraCurve, useCameraMap } from './useCameraMap';
import { TORII, GROUND } from './config';
import { groundHeight } from '../../lib/journey/ground';

// Torii único do hero: a TORII.toriiDistance do início do caminho. A câmera acelera até ele
// e o atravessa quando o "Sobre" entra (ver cameraMap.js); do outro lado aparece o "Sobre Mim".
export default function Torii() {
  const { body, top } = useToriiMaterials();
  const { params } = useCameraMap();

  const { position, rotationY } = useMemo(() => {
    const curve = getCameraCurve();
    const point = curve.getPointAt(params.toriiT);
    const tangent = curve.getTangentAt(params.toriiT, new Vector3());
    return {
      // Pilares pousados no chão do vale (fica ~baseDrop abaixo da câmera, ver GROUND.profile)
      position: [point.x, groundHeight(point.x, point.z, GROUND), point.z],
      rotationY: Math.atan2(tangent.x, tangent.z),
    };
  }, [params.toriiT]);

  return <ToriiGate spec={TORII} body={body} top={top} position={position} rotation={[0, rotationY, 0]} />;
}
