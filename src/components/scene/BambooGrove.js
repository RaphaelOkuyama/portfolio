'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { mulberry32 } from '../../lib/journey/ridge';
import { groundHeight } from '../../lib/journey/ground';
import { useAccentMaterials } from './useAccentMaterials';
import { bambooLeavesGeometry, bambooStalkGeometry, kodamaGeometry } from './shrineGeometry';
import { BAMBOO, GROUND, KODAMA } from './config';
import { wind } from '../../lib/journey/wind';

// Caules do bambuzal (sementes fixas: o mesmo bosque em toda visita)
function stalks(count) {
  const rand = mulberry32(73);
  const perGrove = Math.ceil(count / BAMBOO.groves.length);
  return BAMBOO.groves.flatMap(({ x, z }) => Array.from({ length: perGrove }, () => {
    const px = x[0] + rand() * (x[1] - x[0]);
    const pz = z[0] + rand() * (z[1] - z[0]);
    return {
      base: new Vector3(px, groundHeight(px, pz, GROUND) - 0.2, pz),
      height: BAMBOO.height[0] + rand() * (BAMBOO.height[1] - BAMBOO.height[0]),
      phase: rand() * Math.PI * 2,
      lean: (rand() - 0.5) * 0.08,
    };
  }));
}

const up = new Vector3(0, 1, 0);
const tilt = new Quaternion();
const gustTilt = new Quaternion();
const GUST_AXIS = new Vector3(0, 0, 1);
const axis = new Vector3();
const matrix = new Matrix4();
const scale = new Vector3();
const tip = new Vector3();
const cameraAt = new Vector3();

// 竹林: bambuzal dos dois lados do caminho entre o torii e o jardim, balançando ao vento.
// Cada caule inclina em volta da própria base; o tufo de folhas acompanha a ponta
export function BambooGrove() {
  const quality = useJourney((s) => s.quality) ?? 'low';
  const count = BAMBOO.count[quality] ?? BAMBOO.count.low;
  const data = useMemo(() => stalks(count), [count]);
  const materials = useAccentMaterials({ stalk: { accent: 'bamboo' }, leaves: { accent: 'bambooLeaf', double: true } });
  const stalkRef = useRef(null);
  const leafRef = useRef(null);
  const time = useRef(0);

  const place = (t) => {
    data.forEach((s, i) => {
      // Balanço próprio de cada caule; com vento (Fūjin) ele cresce e o bambuzal inteiro verga
      // para o mesmo lado
      const angle = s.lean + Math.sin(t * 0.9 + s.phase) * BAMBOO.sway * (1 + wind.gust * 2.5);
      axis.set(Math.cos(s.phase), 0, Math.sin(s.phase));
      tilt.setFromAxisAngle(axis, angle);
      gustTilt.setFromAxisAngle(GUST_AXIS, -wind.gust * 0.1);
      tilt.premultiply(gustTilt);
      matrix.compose(s.base, tilt, scale.set(1.7, s.height, 1.7));
      stalkRef.current.setMatrixAt(i, matrix);
      // Ponta do caule inclinado: o tufo de folhas vai junto
      tip.copy(up).multiplyScalar(s.height).applyQuaternion(tilt).add(s.base);
      // A copa já vem no tamanho da cena (galhos e folhas descendo pelo terço de cima do caule)
      matrix.compose(tip, tilt, scale.set(1.25, 1.25, 1.25));
      leafRef.current.setMatrixAt(i, matrix);
    });
    stalkRef.current.instanceMatrix.needsUpdate = true;
    leafRef.current.instanceMatrix.needsUpdate = true;
  };

  useEffect(() => {
    if (stalkRef.current && leafRef.current) place(0);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (!stalkRef.current || journeyStore.getState().reducedMotion) return;
    time.current += delta;
    place(time.current);
  });

  return (
    <>
      <instancedMesh key={`s${count}`} ref={stalkRef} args={[bambooStalkGeometry(), materials.stalk, count]} frustumCulled={false} />
      <instancedMesh key={`l${count}`} ref={leafRef} args={[bambooLeavesGeometry(), materials.leaves, count]} frustumCulled={false} />
    </>
  );
}

// 木霊: espíritos pequenos no chão do bambuzal. Quando a câmera chega perto, as cabeças giram
// de um lado para o outro (o estalo que, na lenda, é o eco da floresta)
export function Kodama() {
  const materials = useAccentMaterials({ body: { accent: 'kodama' }, face: { accent: 'toriiTop' } });
  const { body, head, face } = kodamaGeometry();
  const heads = useRef([]);
  const spots = useMemo(() => KODAMA.spots.map(([x, z, turn]) => ({
    position: [x, groundHeight(x, z, GROUND), z],
    at: new Vector3(x, groundHeight(x, z, GROUND), z),
    // De frente para o caminho (centro), com um desvio de cada um
    rotationY: Math.atan2(-x, 6) + turn * 0.3,
    phase: (x * 7 + z * 3) % (Math.PI * 2),
  })), []);
  const time = useRef(0);

  useFrame((state, delta) => {
    if (journeyStore.getState().reducedMotion) return;
    time.current += delta;
    state.camera.getWorldPosition(cameraAt);
    spots.forEach((s, i) => {
      const h = heads.current[i];
      if (!h) return;
      const distance = cameraAt.distanceTo(s.at);
      // Perto: a cabeça gira rápido em pequenos trancos; longe: quase parada
      const near = Math.max(0, 1 - distance / KODAMA.near);
      const rattle = Math.sign(Math.sin(time.current * 7 + s.phase)) * 0.35 * near;
      h.rotation.z += (rattle + Math.sin(time.current * 0.6 + s.phase) * 0.06 - h.rotation.z) * Math.min(1, delta * 14);
    });
  });

  return spots.map((s, i) => (
    <group key={i} position={s.position} rotation={[0, s.rotationY, 0]} scale={KODAMA.scale}>
      <mesh geometry={body} material={materials.body} dispose={null} />
      <group ref={(el) => { heads.current[i] = el; }} position={[0, 0.34, 0]}>
        <mesh geometry={head} material={materials.body} dispose={null} />
        <mesh geometry={face} material={materials.face} dispose={null} />
      </group>
    </group>
  ));
}
