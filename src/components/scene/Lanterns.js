'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, Color, MeshBasicMaterial, Object3D } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { mulberry32 } from '../../lib/journey/ridge';
import { LANTERNS } from './config';

const lerp = (a, b, t) => a + (b - a) * t;

// Estado inicial de uma lanterna na faixa do rio (coordenadas locais do rio: x lateral, z ao longo)
function spawn(rand, z) {
  return {
    x: lerp(LANTERNS.laneX[0], LANTERNS.laneX[1], rand()),
    z,
    phase: rand() * Math.PI * 2,
    speed: LANTERNS.speed * (0.7 + rand() * 0.6),
  };
}

// 灯籠流し: lanternas de papel descendo o rio; cada mensagem enviada solta mais uma perto da câmera
export default function Lanterns() {
  const quality = useJourney((s) => s.quality);
  const baseCount = LANTERNS.count[quality] ?? LANTERNS.count.low;
  const capacity = baseCount + LANTERNS.maxReleased;
  const meshRef = useRef(null);

  const geometry = useMemo(() => new BoxGeometry(0.34, 0.42, 0.34), []);
  const material = useMemo(() => new MeshBasicMaterial({ toneMapped: false }), []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // Lanternas fixas espalhadas na faixa + as soltas pelo formulário
  const lanterns = useRef(null);
  const rand = useMemo(() => mulberry32(71), []);
  if (lanterns.current === null || lanterns.current.base !== baseCount) {
    const [z0, z1] = LANTERNS.laneZ;
    lanterns.current = {
      base: baseCount,
      items: Array.from({ length: baseCount }, (_, i) => spawn(rand, lerp(z1, z0, i / baseCount))),
    };
  }
  const releasesSeen = useRef(journeyStore.getState().lanternReleases);

  const dummy = useMemo(() => new Object3D(), []);
  const colors = useMemo(() => ({ base: new Color(), target: new Color() }), []);
  const glow = useRef(null);
  const time = useRef(0);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    // Rio escondido (antes do contato ou em rotas congeladas): não anima nem pede frames
    if (!mesh || !mesh.parent?.visible) return;
    const journey = journeyStore.getState();
    const { items } = lanterns.current;

    // Mensagem enviada: nova lanterna entra perto da margem da câmera
    while (releasesSeen.current < journey.lanternReleases) {
      releasesSeen.current += 1;
      if (items.length < capacity) items.push({ ...spawn(rand, LANTERNS.laneZ[1] + 1.5), released: true });
    }

    const moving = !journey.reducedMotion;
    if (moving) time.current += delta;
    const [z0, z1] = LANTERNS.laneZ;

    // Correnteza: todas se afastam da câmera; as fixas voltam ao começo, as soltas somem no fim
    for (let i = items.length - 1; i >= 0; i--) {
      const l = items[i];
      if (moving) l.z -= l.speed * delta;
      if (l.z < z0) {
        if (l.released) items.splice(i, 1);
        else l.z = z1;
      }
    }

    items.forEach((l, i) => {
      dummy.position.set(l.x + Math.sin(time.current * 0.5 + l.phase) * 0.15, 0.22 + Math.sin(time.current * 1.6 + l.phase) * 0.04, l.z);
      dummy.rotation.set(0, l.phase + time.current * 0.1, Math.sin(time.current + l.phase) * 0.05);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;

    // Brilho: forte à noite (dispara o bloom), suave de dia
    const intensity = LANTERNS.glow[journey.theme];
    glow.current = glow.current === null ? intensity : lerp(glow.current, intensity, 1 - Math.exp(-delta * 4));
    colors.base.set(SCENE_ACCENTS[journey.theme].lantern);
    material.color.copy(colors.base).multiplyScalar(glow.current);

    if (moving || items.some((l) => l.released)) state.invalidate();
  });

  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[geometry, material, capacity]}
      frustumCulled={false}
    />
  );
}
