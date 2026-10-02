'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DodecahedronGeometry, MeshBasicMaterial } from 'three';
import { journeyStore } from '../../store/journey';
import { SCENE_ACCENTS, THEMES } from '../../lib/palette';
import { groundHeight } from '../../lib/journey/ground';
import { GARDEN, GROUND } from './config';
import { useGardenPlacement } from './gardenPlacement';
import Fireflies from './Fireflies';

// 枯山水: as 6 pedras do Stack (uma por área), assentadas na areia que o chão do vale pinta
// (Ground.js). Fazem parte da paisagem: existem desde longe e ficam para trás, sem aparecer do nada
export default function ZenGarden() {
  const { center, range } = useGardenPlacement();
  const stoneRefs = useRef([]);
  const geometry = useMemo(() => new DodecahedronGeometry(1, 0), []);
  const materials = useMemo(() => GARDEN.stones.map(() => new MeshBasicMaterial()), []);
  useEffect(
    () => () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    },
    [geometry, materials],
  );

  // Altura do chão sob cada pedra (a areia é plana, mas a pedra mais perto da borda pode não ser)
  const bases = useMemo(
    () => GARDEN.stones.map((s) => groundHeight(center[0] + s.x, center[2] + s.z, GROUND) - center[1]),
    [center],
  );

  const scratch = useMemo(() => ({ stone: new Color(), accent: new Color(), target: new Color(), init: false }), []);

  useFrame((state, delta) => {
    const { theme, activeStone } = journeyStore.getState();
    const k = scratch.init ? 1 - Math.exp(-delta * 4) : 1;
    scratch.init = true;
    scratch.stone.set(SCENE_ACCENTS[theme].stone);
    scratch.accent.set(THEMES[theme].accent);
    let pending = false;

    GARDEN.stones.forEach((spec, i) => {
      const mesh = stoneRefs.current[i];
      if (!mesh) return;
      const isActive = activeStone === i;
      // Só um toque de acento na pedra: quem marca a escolhida são os anéis acesos na areia
      scratch.target.copy(scratch.stone);
      if (isActive) scratch.target.lerp(scratch.accent, GARDEN.activeStoneTint);
      const c = materials[i].color;
      c.lerp(scratch.target, k);
      // A escolhida se ergue um pouco da areia
      // Meia altura da pedra ~0,5r: o centro fica um pouco abaixo disso para a base afundar na areia
      const rest = bases[i] + spec.r * (0.5 - GARDEN.sink);
      const y = rest + (isActive ? spec.r * 0.25 : 0);
      mesh.position.y += (y - mesh.position.y) * k;
      if (Math.abs(y - mesh.position.y) > 0.002) pending = true;
      if (Math.abs(c.r - scratch.target.r) + Math.abs(c.g - scratch.target.g) + Math.abs(c.b - scratch.target.b) > 0.002) {
        pending = true;
      }
    });

    if (pending) state.invalidate();
  });

  return (
    <group position={center}>
      {GARDEN.stones.map((spec, i) => (
        <mesh
          key={i}
          ref={(m) => {
            stoneRefs.current[i] = m;
          }}
          geometry={geometry}
          material={materials[i]}
          position={[spec.x, bases[i], spec.z]}
          scale={[spec.r, spec.r * 0.6, spec.r * 0.85]}
          rotation={[0, i * 1.3, 0]}
        />
      ))}
      <Fireflies range={range} />
    </group>
  );
}
