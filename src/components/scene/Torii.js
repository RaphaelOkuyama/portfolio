'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import ToriiGate, { useToriiMaterials } from './ToriiGate';
import { getCameraCurve, useCameraMap } from './useCameraMap';
import { TORII, GROUND } from './config';
import { groundHeight } from '../../lib/journey/ground';
import { toNdc } from '../../lib/pointer';
import { setToriiHitTester } from '../../lib/toriiHit';

// Torii único do hero: a TORII.toriiDistance do início do caminho. A câmera acelera até ele
// e o atravessa quando o "Sobre" entra (ver cameraMap.js); do outro lado aparece o "Sobre Mim".
export default function Torii() {
  const { body, top } = useToriiMaterials();
  const { params } = useCameraMap();
  const groupRef = useRef(null);
  const camera = useThree((s) => s.camera);

  // Clicar no torii tira a sorte (おみくじ): a página pergunta à cena se o clique acertou o portão
  useEffect(() => {
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    return setToriiHitTester((clientX, clientY) => {
      if (!groupRef.current) return false;
      const { x, y } = toNdc(clientX, clientY, window.innerWidth, window.innerHeight);
      raycaster.setFromCamera(ndc.set(x, y), camera);
      return raycaster.intersectObject(groupRef.current, true).length > 0;
    });
  }, [camera]);

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

  return (
    <group ref={groupRef}>
      <ToriiGate spec={TORII} body={body} top={top} position={position} rotation={[0, rotationY, 0]} />
    </group>
  );
}
