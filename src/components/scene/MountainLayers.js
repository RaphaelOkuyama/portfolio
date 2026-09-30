'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Shape, ShapeGeometry } from 'three';
import { journeyStore } from '../../store/journey';
import { SEASONS } from '../../lib/palette';
import { sampleSeason, clamp01 } from '../../lib/journey/season';
import { ridgePoints } from '../../lib/journey/ridge';
import { MOUNTAIN_LAYERS } from './config';

// Distância em que a camada atinge o tom "longe"
const FAR_DISTANCE = 60;

function buildGeometry(layer) {
  const points = ridgePoints(layer);
  const shape = new Shape();
  shape.moveTo(points[0][0], layer.bottom);
  points.forEach(([x, y]) => shape.lineTo(x, y));
  shape.lineTo(points[points.length - 1][0], layer.bottom);
  shape.closePath();
  return new ShapeGeometry(shape);
}

// Silhuetas em camadas; o tom vai de "perto" a "longe" conforme a distância da câmera
export default function MountainLayers() {
  const geometries = useMemo(() => MOUNTAIN_LAYERS.map(buildGeometry), []);
  const materials = useRef([]);
  const initialized = useRef(false);
  const tones = useMemo(() => ({ near: new Color(), mid: new Color(), far: new Color(), target: new Color() }), []);

  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  useFrame((state, delta) => {
    const { theme, seasonMix } = journeyStore.getState();
    const [near, mid, far] = sampleSeason(SEASONS[theme], seasonMix).mountains;
    tones.near.set(near);
    tones.mid.set(mid);
    tones.far.set(far);
    // Primeiro frame aplica a cor direto (sem piscar branco); depois amortece
    const k = initialized.current ? 1 - Math.exp(-delta * 6) : 1;
    initialized.current = true;
    let pending = false;

    MOUNTAIN_LAYERS.forEach((layer, i) => {
      const material = materials.current[i];
      if (!material) return;
      const t = clamp01(Math.abs(state.camera.position.z - layer.z) / FAR_DISTANCE);
      if (t < 0.5) tones.target.copy(tones.near).lerp(tones.mid, t * 2);
      else tones.target.copy(tones.mid).lerp(tones.far, (t - 0.5) * 2);
      material.color.lerp(tones.target, k);
      const c = material.color;
      if (Math.abs(c.r - tones.target.r) + Math.abs(c.g - tones.target.g) + Math.abs(c.b - tones.target.b) > 0.002) {
        pending = true;
      }
    });

    if (pending) state.invalidate();
  });

  return MOUNTAIN_LAYERS.map((layer, i) => (
    <mesh key={layer.seed} geometry={geometries[i]} position={[layer.x, 0, layer.z]}>
      <meshBasicMaterial
        ref={(m) => {
          materials.current[i] = m;
        }}
      />
    </mesh>
  ));
}
