'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D, Vector3 } from 'three';
import { journeyStore } from '../../store/journey';
import { groundHeight } from '../../lib/journey/ground';
import { wind } from '../../lib/journey/wind';
import { TANABATA_COLORS, tanzakuLayout } from '../../lib/journey/tanabata';
import { resumeData } from '../../data/resume';
import { useAccentMaterials } from './useAccentMaterials';
import { useGardenPlacement } from './gardenPlacement';
import { fukinagashiGeometry, segment, tanabataBambooGeometry, tanzakuGeometry } from './tanabataGeometry';
import { assemble } from './lowpoly';
import Fireflies from './Fireflies';
import { GROUND, TANABATA } from './config';

// Quantas ferramentas por área (as mesmas em pt e en): uma tira para cada
const COUNTS = resumeData.pt.techSection.categories.map((c) => c.items.length);

// 七夕: os dois bambus de Tanabata na clareira do Stack, com as tiras de papel (短冊) de todas as
// ferramentas nas cores das áreas. As tiras balançam com o vento do scroll; a área escolhida no
// Stack balança mais, cresce um pouco e brilha. Por cima do caminho, a corda com os 吹き流し
export default function Tanabata() {
  const { range } = useGardenPlacement();
  const { wood, leaf, paper } = useAccentMaterials({
    wood: { accent: 'bamboo' },
    leaf: { accent: 'bambooLeaf', double: true },
    paper: { accent: 'craft', double: true },
  });

  // Bases dos colmos no chão e as tiras no mundo
  const bamboos = useMemo(() => TANABATA.bamboos.map((b) => ({
    ...b, y: groundHeight(b.x, b.z, GROUND), height: TANABATA.height,
  })), []);
  const strips = useMemo(() => tanzakuLayout(COUNTS, bamboos), [bamboos]);

  // Corda entre as copas, com uma barriga no meio, e os pontos onde pendem os 吹き流し
  const rope = useMemo(() => {
    const [a, b] = bamboos;
    const left = new Vector3(a.x, a.y + TANABATA.rope, a.z);
    const right = new Vector3(b.x, b.y + TANABATA.rope, b.z);
    const at = (t) => new Vector3().lerpVectors(left, right, t).add(new Vector3(0, -Math.sin(Math.PI * t) * 0.5, 0));
    const steps = 8;
    const geometry = assemble(Array.from({ length: steps }, (_, i) => segment(at(i / steps), at((i + 1) / steps), 0.03)));
    const hangers = TANABATA.streamers.map((x) => {
      const t = (x - left.x) / (right.x - left.x);
      return at(t);
    });
    return { geometry, hangers };
  }, [bamboos]);
  useEffect(() => () => rope.geometry.dispose(), [rope]);

  const stripRef = useRef(null);
  const streamerRefs = useRef([]);
  const dummy = useMemo(() => new Object3D(), []);
  const colors = useMemo(() => TANABATA_COLORS.map((c) => new Color(c)), []);
  const tint = useMemo(() => new Color(), []);
  const clock = useRef(0);
  const bright = useRef(null);

  useFrame((state, delta) => {
    const mesh = stripRef.current;
    if (!mesh) return;
    const { activeStone, reducedMotion } = journeyStore.getState();
    if (!reducedMotion) clock.current += Math.min(delta, 1 / 20);
    const t = clock.current;
    const gust = wind.gust;
    const k = bright.current ? 1 - Math.exp(-delta * 6) : 1;
    bright.current ??= strips.map(() => 1);

    strips.forEach((s, i) => {
      const chosen = activeStone === s.area;
      const amp = TANABATA.sway * (chosen ? TANABATA.active.sway : 1) * (1 + gust * 3);
      const side = Math.sign(s.x);
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(
        Math.sin(t * 1.1 + s.phase * 0.7) * amp * 0.6,
        Math.sin(t * 0.6 + s.phase) * 0.35,
        Math.sin(t * 1.7 + s.phase) * amp + side * gust * 0.35,
      );
      dummy.scale.setScalar(chosen ? TANABATA.active.scale : 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // A área escolhida acende; as outras esmaecem um pouco
      const target = activeStone === null || activeStone === undefined ? 1 : chosen ? TANABATA.active.bright : TANABATA.active.dim;
      bright.current[i] += (target - bright.current[i]) * k;
      mesh.setColorAt(i, tint.copy(colors[s.area]).multiplyScalar(bright.current[i]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // As serpentinas balançam devagar, mais com o vento
    streamerRefs.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.z = Math.sin(t * 0.9 + i * 1.3) * 0.08 * (1 + gust * 4);
      g.rotation.x = Math.sin(t * 0.7 + i) * 0.05 * (1 + gust * 3);
    });
  });

  const { x: cx, z: cz } = { x: 0, z: (bamboos[0].z + bamboos[1].z) / 2 };
  return (
    <>
      {bamboos.map((b) => {
        const g = tanabataBambooGeometry(TANABATA.height, b.side);
        return (
          <group key={b.side} position={[b.x, b.y, b.z]}>
            <mesh geometry={g.wood} material={wood} dispose={null} />
            <mesh geometry={g.leaves} material={leaf} dispose={null} />
          </group>
        );
      })}
      <instancedMesh
        ref={stripRef}
        args={[tanzakuGeometry(...TANABATA.strip), paper, strips.length]}
        frustumCulled={false}
      />
      <mesh geometry={rope.geometry} material={wood} dispose={null} />
      {rope.hangers.map((p, i) => (
        <group key={i} ref={(g) => { streamerRefs.current[i] = g; }} position={p}>
          <mesh geometry={fukinagashiGeometry(TANABATA_COLORS, TANABATA.streamerLength)} material={paper} dispose={null} />
        </group>
      ))}
      <group position={[cx, groundHeight(cx, cz, GROUND), cz]}>
        <Fireflies range={range} />
      </group>
    </>
  );
}
