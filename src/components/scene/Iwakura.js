'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, DoubleSide, MeshBasicMaterial, Vector3 } from 'three';
import { journeyStore } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { groundHeight } from '../../lib/journey/ground';
import { getCameraCurve, useCameraMap } from './useCameraMap';
import { iwakuraGeometry } from './iwakuraGeometry';
import { GROUND, IWAKURA } from './config';

const PARTS = ['iwakura', 'shimenawa', 'shide'];

// 磐座 (iwakura): a rocha sagrada amarrada com a corda 注連縄 e os papéis 紙垂, pousada no chão
// ao lado do torii do hero. Mesmo crossfade 昼/夜 dos materiais do torii
export default function Iwakura() {
  const { params } = useCameraMap();
  // Celular em pé: não há espaço ao lado do torii sem a pedra ficar cortada atrás do texto
  const roomy = useThree((s) => s.size.width / s.size.height >= IWAKURA.minAspect);
  const materials = useMemo(() => ({
    iwakura: new MeshBasicMaterial({ vertexColors: true }),
    shimenawa: new MeshBasicMaterial({ vertexColors: true }),
    shide: new MeshBasicMaterial({ vertexColors: true, side: DoubleSide }),
  }), []);
  const targets = useMemo(() => Object.fromEntries(PARTS.map((k) => [k, new Color()])), []);
  const initialized = useRef(false);
  const geometry = iwakuraGeometry();

  useEffect(() => () => PARTS.forEach((k) => materials[k].dispose()), [materials]);

  useFrame((state, delta) => {
    const accents = SCENE_ACCENTS[journeyStore.getState().theme];
    const k = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    initialized.current = true;
    let moving = false;
    for (const part of PARTS) {
      targets[part].set(accents[part]);
      const c = materials[part].color;
      c.lerp(targets[part], k);
      if (Math.abs(c.r - targets[part].r) + Math.abs(c.g - targets[part].g) + Math.abs(c.b - targets[part].b) > 0.002) moving = true;
    }
    if (moving) state.invalidate();
  });

  // Ao lado do torii, no referencial do portão (x para a direita do caminho, z para trás)
  const { position, rotationY } = useMemo(() => {
    const curve = getCameraCurve();
    const point = curve.getPointAt(params.toriiT);
    const tangent = curve.getTangentAt(params.toriiT, new Vector3());
    // Referencial de quem caminha: para frente (tangente do caminho) e para a direita
    const forward = new Vector3(tangent.x, 0, tangent.z).normalize();
    const side = new Vector3(-forward.z, 0, forward.x);
    const back = forward;
    // A frente da peça (o +z local, com os papéis) olha para quem vem pelo caminho
    const yaw = Math.atan2(-forward.x, -forward.z);
    const x = point.x + side.x * IWAKURA.offset[0] + back.x * IWAKURA.offset[1];
    const z = point.z + side.z * IWAKURA.offset[0] + back.z * IWAKURA.offset[1];
    // Afunda um pouco no chão: pedra assentada, não pousada
    return { position: [x, groundHeight(x, z, GROUND) - IWAKURA.sink, z], rotationY: yaw + IWAKURA.turn };
  }, [params.toriiT]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={IWAKURA.scale} visible={roomy}>
      <mesh geometry={geometry.rock} material={materials.iwakura} dispose={null} />
      <mesh geometry={geometry.rope} material={materials.shimenawa} dispose={null} />
      <mesh geometry={geometry.straw} material={materials.shimenawa} dispose={null} />
      <mesh geometry={geometry.paper} material={materials.shide} dispose={null} />
    </group>
  );
}
