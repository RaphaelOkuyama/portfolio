'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, Vector3 } from 'three';
import { useJourney } from '../../store/journey';
import { smoothstep } from '../../lib/journey/math';
import ToriiGate, { useToriiMaterials } from './ToriiGate';
import { createCameraCurve } from './cameraCurve';
import { SENBON } from './config';

// Portão some ao chegar perto da câmera para não virar uma parede atrás do texto
const FADE_NEAR = 2;
const FADE_FAR = 7;

// Posição e rotação de cada portão ao longo da curva, dentro da faixa [start, end] do progresso
function gateTransforms(curve, [start, end], count) {
  const point = new Vector3();
  const tangent = new Vector3();
  const len = end - start;
  // Começa um pouco depois da entrada na seção e termina antes da saída
  const first = start + len * 0.1;
  const last = end - len * 0.05;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? first : first + ((last - first) * i) / (count - 1);
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent);
    return {
      key: i,
      position: [point.x, point.y - SENBON.baseDrop, point.z],
      center: new Vector3(point.x, point.y, point.z),
      rotationY: Math.atan2(tangent.x, tangent.z),
    };
  });
}

// 千本鳥居: túnel de portões que a câmera atravessa enquanto o texto do "Sobre" se revela
export default function SenbonTorii() {
  // Cores (com crossfade 昼/夜) vêm do material compartilhado; cada portão tem a própria opacidade
  const shared = useToriiMaterials();
  const quality = useJourney((s) => s.quality);
  const range = useJourney((s) => s.sectionRanges.about) ?? SENBON.fallbackRange;
  const count = SENBON.count[quality] ?? SENBON.count.low;
  const curve = useMemo(() => createCameraCurve(), []);
  const [start, end] = range;
  const gates = useMemo(() => gateTransforms(curve, [start, end], count), [curve, start, end, count]);

  const materials = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        body: new MeshBasicMaterial({ transparent: true }),
        top: new MeshBasicMaterial({ transparent: true }),
      })),
    [count],
  );
  useEffect(
    () => () =>
      materials.forEach((m) => {
        m.body.dispose();
        m.top.dispose();
      }),
    [materials],
  );

  const lastOpacity = useRef([]);

  useFrame((state) => {
    let changed = false;
    gates.forEach((gate, i) => {
      const m = materials[i];
      if (!m) return;
      m.body.color.copy(shared.body.color);
      m.top.color.copy(shared.top.color);
      const opacity = smoothstep(FADE_NEAR, FADE_FAR, state.camera.position.distanceTo(gate.center));
      m.body.opacity = opacity;
      m.top.opacity = opacity;
      m.body.visible = opacity > 0.01;
      m.top.visible = m.body.visible;
      if (Math.abs((lastOpacity.current[i] ?? -1) - opacity) > 0.001) changed = true;
      lastOpacity.current[i] = opacity;
    });
    if (changed) state.invalidate();
  });

  return gates.map((gate, i) => (
    <ToriiGate
      key={gate.key}
      spec={SENBON}
      body={materials[i].body}
      top={materials[i].top}
      position={gate.position}
      rotation={[0, gate.rotationY, 0]}
    />
  ));
}
